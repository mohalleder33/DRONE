const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Ammunition = require('../models/Ammunition');
const Platform = require('../models/Platform');
const { createNotification, createBulkNotifications, sendRealtimeNotification } = require('../services/notificationService');
const User = require('../models/User');

const isMockMode = () => process.env.USE_MOCK_DB === 'true';

// Helper functions for notifications
const getAdminUsers = async () => {
  return await User.find({ role: 'admin' }).select('_id');
};

const getPlatformCommander = async (platformId) => {
  return await User.findOne({ role: 'platformCommander', assignedPlatformId: platformId });
};

// ============== GET all ammunition ==============
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 10, search = '', type = '' } = req.query;

  if (isMockMode()) {
    let ammunition = global.mockDB?.ammunition || [];
    if (search) ammunition = ammunition.filter(a => a.name.includes(search) || a.caliber.includes(search));
    if (type) ammunition = ammunition.filter(a => a.type === type);
    const start = (page - 1) * limit;
    const paginated = ammunition.slice(start, start + limit);
    return res.json({
      data: paginated,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(ammunition.length / limit),
        total: ammunition.length,
        limit: parseInt(limit)
      }
    });
  }

  try {
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { caliber: { $regex: search, $options: 'i' } }
      ];
    }
    if (type) query.type = type;

    const ammunition = await Ammunition.find(query)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Ammunition.countDocuments(query);

    res.json({
      data: ammunition,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching ammunition:', error);
    res.status(500).json({ message: 'خطأ في تحميل الذخائر' });
  }
});

// ============== GET ammunition stock details ==============
router.get('/:id/stock', auth, async (req, res) => {
  const { id } = req.params;

  if (isMockMode()) {
    const item = global.mockDB?.ammunition?.find(a => a.id === id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json({
      headquarters: item.headquarters || 0,
      platforms: item.distribution?.platforms || []
    });
  }

  try {
    const item = await Ammunition.findById(id);
    if (!item) return res.status(404).json({ message: 'الذخيرة غير موجودة' });
    res.json({
      headquarters: item.headquarters,
      platforms: item.distribution?.platforms || {}
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ message: 'خطأ في تحميل المخزون' });
  }
});

// ============== POST create ammunition type ==============
router.post('/', auth, async (req, res) => {
  const { name, caliber, type, compatibleEquipment } = req.body;
  if (!name || !caliber) {
    return res.status(400).json({ message: 'الاسم والعيار مطلوبان' });
  }

  if (isMockMode()) {
    const newItem = {
      id: Date.now().toString(),
      name,
      caliber,
      type: type || 'خارقة',
      compatibleEquipment: compatibleEquipment || '',
      headquarters: 0,
      platforms: 0,
      total: 0,
      minThreshold: 100,
      distribution: { headquarters: 0, platforms: {} }
    };
    if (!global.mockDB.ammunition) global.mockDB.ammunition = [];
    global.mockDB.ammunition.push(newItem);
    return res.status(201).json(newItem);
  }

  try {
    const existing = await Ammunition.findOne({ name, caliber });
    if (existing) {
      return res.status(400).json({ message: 'صنف بنفس الاسم والعيار موجود مسبقاً' });
    }
    const newAmmunition = new Ammunition({
      name,
      caliber,
      type: type || 'خارقة',
      compatibleEquipment: compatibleEquipment || '',
      headquarters: 0,
      platforms: 0,
      total: 0,
      minThreshold: 100,
      distribution: { headquarters: 0, platforms: {} }
    });
    const saved = await newAmmunition.save();
    console.log('✅ Ammunition type saved:', saved._id);
    
    // إشعار للمسؤولين
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    await createBulkNotifications(
      adminIds,
      `➕ إضافة صنف ذخيرة جديد: ${name}`,
      `تم إضافة صنف ذخيرة جديد ${name} (${caliber})`,
      'assignment',
      { ammunitionId: saved._id, name, caliber }
    );
    
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error saving ammunition:', error);
    res.status(500).json({ message: 'فشل إضافة الذخيرة' });
  }
});

// ============== PUT update ammunition ==============
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { minThreshold, name, caliber, type } = req.body;

  if (isMockMode()) {
    const ammunition = global.mockDB?.ammunition || [];
    const index = ammunition.findIndex(a => a.id === id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    ammunition[index] = { ...ammunition[index], ...req.body };
    return res.json(ammunition[index]);
  }

  try {
    const updated = await Ammunition.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'الذخيرة غير موجودة' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating ammunition:', error);
    res.status(500).json({ message: 'فشل التحديث' });
  }
});

// ============== DELETE ammunition type ==============
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (isMockMode()) {
    global.mockDB.ammunition = global.mockDB?.ammunition?.filter(a => a.id !== id) || [];
    return res.json({ message: 'Deleted' });
  }

  try {
    const deleted = await Ammunition.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'الذخيرة غير موجودة' });
    
    // إشعار للمسؤولين
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    await createBulkNotifications(
      adminIds,
      `🗑️ حذف صنف ذخيرة: ${deleted.name}`,
      `تم حذف صنف الذخيرة ${deleted.name} (${deleted.caliber})`,
      'assignment',
      { ammunitionId: deleted._id, name: deleted.name, caliber: deleted.caliber }
    );
    
    res.json({ message: 'تم الحذف' });
  } catch (error) {
    console.error('Error deleting ammunition:', error);
    res.status(500).json({ message: 'فشل الحذف' });
  }
});

// ============== POST add to warehouse ==============
router.post('/add-to-warehouse/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const io = req.app.get('io');

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: 'الكمية غير صالحة' });
  }

  if (isMockMode()) {
    const ammunition = global.mockDB?.ammunition || [];
    const index = ammunition.findIndex(a => a.id === id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    ammunition[index].headquarters += quantity;
    ammunition[index].total = ammunition[index].headquarters + ammunition[index].platforms;
    ammunition[index].distribution.headquarters = ammunition[index].headquarters;
    return res.json({ message: 'Added to warehouse', newQuantity: ammunition[index].headquarters });
  }

  try {
    const item = await Ammunition.findById(id);
    if (!item) return res.status(404).json({ message: 'الذخيرة غير موجودة' });

    const oldQuantity = item.headquarters;
    item.headquarters += quantity;
    item.total = item.headquarters + item.platforms;
    item.distribution.headquarters = item.headquarters;
    await item.save();

    // إشعارات
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    await createBulkNotifications(
      adminIds,
      `📦 توريد ذخيرة: ${item.name}`,
      `تم توريد ${quantity} من ${item.name} إلى المستودع. الكمية الحالية: ${item.headquarters}`,
      'assignment',
      { ammunitionId: item._id, name: item.name, addedQuantity: quantity, newQuantity: item.headquarters }
    );

    if (io) {
      const notification = { title: `توريد ذخيرة: ${item.name}`, message: `تم توريد ${quantity} من ${item.name} إلى المستودع`, read: false, createdAt: new Date() };
      adminIds.forEach(id => sendRealtimeNotification(io, id, notification));
    }

    res.json({ message: 'تم توريد الذخيرة', newQuantity: item.headquarters });
  } catch (error) {
    console.error('Error adding to warehouse:', error);
    res.status(500).json({ message: 'فشل التوريد' });
  }
});

// ============== POST distribute ammunition ==============
router.post('/distribute/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { platformId, quantity } = req.body;
  const io = req.app.get('io');

  if (!platformId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'بيانات غير صالحة' });
  }

  if (isMockMode()) {
    const ammunition = global.mockDB?.ammunition || [];
    const index = ammunition.findIndex(a => a.id === id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    if (ammunition[index].headquarters < quantity) {
      return res.status(400).json({ message: 'الكمية غير متوفرة في المستودع' });
    }
    ammunition[index].headquarters -= quantity;
    ammunition[index].platforms += quantity;
    ammunition[index].total = ammunition[index].headquarters + ammunition[index].platforms;
    if (!ammunition[index].distribution.platforms) ammunition[index].distribution.platforms = {};
    ammunition[index].distribution.platforms[platformId] = (ammunition[index].distribution.platforms[platformId] || 0) + quantity;
    return res.json({ message: 'Distributed' });
  }

  try {
    const item = await Ammunition.findById(id);
    if (!item) return res.status(404).json({ message: 'الذخيرة غير موجودة' });
    if (item.headquarters < quantity) {
      return res.status(400).json({ message: `الكمية غير متوفرة في المستودع. المتاح: ${item.headquarters}` });
    }

    const platform = await Platform.findOne({ id: platformId });
    if (!platform) {
      return res.status(404).json({ message: 'المنصة غير موجودة' });
    }

    item.headquarters -= quantity;
    item.platforms += quantity;
    item.total = item.headquarters + item.platforms;
    if (!item.distribution.platforms) item.distribution.platforms = {};
    item.distribution.platforms[platformId] = (item.distribution.platforms[platformId] || 0) + quantity;
    await item.save();

    // إشعارات
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    const platformCommander = await getPlatformCommander(platformId);

    await createBulkNotifications(
      adminIds,
      `💣 توزيع ذخيرة: ${item.name}`,
      `تم توزيع ${quantity} من ${item.name} إلى منصة ${platform.name}`,
      'assignment',
      { ammunitionId: item._id, name: item.name, quantity, platformId, platformName: platform.name }
    );

    if (platformCommander) {
      await createNotification(
        platformCommander._id,
        `💣 توريد ذخيرة إلى منصتك: ${item.name}`,
        `تم توزيع ${quantity} من ${item.name} إلى منصتك`,
        'assignment',
        { ammunitionId: item._id, name: item.name, quantity }
      );
    }

    if (io) {
      const notification = { title: `توزيع ذخيرة: ${item.name}`, message: `تم توزيع ${quantity} من ${item.name} إلى منصة ${platform.name}`, read: false, createdAt: new Date() };
      adminIds.forEach(id => sendRealtimeNotification(io, id, notification));
      if (platformCommander) sendRealtimeNotification(io, platformCommander._id, notification);
    }

    res.json({ message: `تم توزيع ${quantity} من ${item.name} إلى ${platform.name}` });
  } catch (error) {
    console.error('Error distributing ammunition:', error);
    res.status(500).json({ message: 'فشل التوزيع' });
  }
});

// ============== POST return ammunition ==============
// POST /api/ammunition/return/:id
router.post('/return/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { platformId, quantity } = req.body;
  const io = req.app.get('io');

  if (!platformId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'بيانات غير صالحة: المنصة والكمية مطلوبة' });
  }

  try {
    const item = await Ammunition.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'الذخيرة غير موجودة' });
    }

    // ✅ حساب الكمية الحالية على المنصة (يدعم Object و Map)
    let currentOnPlatform = 0;
    if (item.distribution && item.distribution.platforms) {
      if (item.distribution.platforms instanceof Map) {
        currentOnPlatform = item.distribution.platforms.get(platformId) || 0;
      } else if (typeof item.distribution.platforms === 'object') {
        currentOnPlatform = item.distribution.platforms[platformId] || 0;
      }
    }

    console.log(`Platform ${platformId} current quantity: ${currentOnPlatform}`);

    if (currentOnPlatform < quantity) {
      return res.status(400).json({ 
        message: `الكمية غير متوفرة على المنصة. المتاح: ${currentOnPlatform}` 
      });
    }

    // ✅ تحديث الكميات
    item.platforms -= quantity;
    item.headquarters += quantity;
    item.total = item.headquarters + item.platforms;

    // ✅ تحديث التوزيع (يدعم Object و Map)
    if (item.distribution && item.distribution.platforms) {
      if (item.distribution.platforms instanceof Map) {
        const newValue = (item.distribution.platforms.get(platformId) || 0) - quantity;
        if (newValue <= 0) {
          item.distribution.platforms.delete(platformId);
        } else {
          item.distribution.platforms.set(platformId, newValue);
        }
      } else if (typeof item.distribution.platforms === 'object') {
        item.distribution.platforms[platformId] -= quantity;
        if (item.distribution.platforms[platformId] <= 0) {
          delete item.distribution.platforms[platformId];
        }
      }
    }

    await item.save();

    // إشعارات (اختياري)
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminIds = adminUsers.map(u => u._id);
    await createBulkNotifications(
      adminIds,
      `↩️ إعادة ذخيرة: ${item.name}`,
      `تم إعادة ${quantity} من ${item.name} من المنصة إلى المستودع`,
      'assignment',
      { ammunitionId: item._id, name: item.name, quantity, platformId }
    );

    if (io) {
      const notification = { title: `إعادة ذخيرة: ${item.name}`, message: `تم إعادة ${quantity} من ${item.name}`, read: false, createdAt: new Date() };
      adminIds.forEach(id => sendRealtimeNotification(io, id, notification));
    }

    res.json({ message: `تم إعادة ${quantity} من ${item.name} إلى المستودع` });
  } catch (error) {
    console.error('Error returning ammunition:', error);
    res.status(500).json({ message: 'فشل الإعادة: ' + error.message });
  }
});

// ============== PUT update min threshold ==============
router.put('/update-threshold/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { minThreshold } = req.body;
  const io = req.app.get('io');

  if (minThreshold === undefined || minThreshold < 0) {
    return res.status(400).json({ message: 'الحد الأدنى غير صالح' });
  }

  if (isMockMode()) {
    const ammunition = global.mockDB?.ammunition || [];
    const index = ammunition.findIndex(a => a.id === id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    ammunition[index].minThreshold = minThreshold;
    return res.json({ message: 'Threshold updated' });
  }

  try {
    const item = await Ammunition.findById(id);
    if (!item) return res.status(404).json({ message: 'الذخيرة غير موجودة' });
    
    const oldThreshold = item.minThreshold;
    item.minThreshold = minThreshold;
    await item.save();

    // إشعارات للمسؤولين
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    await createBulkNotifications(
      adminIds,
      `⚙️ تعديل الحد الأدنى: ${item.name}`,
      `تم تعديل الحد الأدنى لصنف ${item.name} من ${oldThreshold} إلى ${minThreshold}`,
      'system',
      { ammunitionId: item._id, name: item.name, oldThreshold, newThreshold: minThreshold }
    );

    res.json({ message: 'تم تحديث الحد الأدنى' });
  } catch (error) {
    console.error('Error updating threshold:', error);
    res.status(500).json({ message: 'فشل التحديث' });
  }
});

// ============== POST scrap ammunition ==============
router.post('/scrap/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { locationType, locationId, quantity, reason } = req.body;
  const io = req.app.get('io');

  if (!quantity || quantity <= 0 || !reason) {
    return res.status(400).json({ message: 'بيانات غير صالحة' });
  }

  if (isMockMode()) {
    const ammunition = global.mockDB?.ammunition || [];
    const index = ammunition.findIndex(a => a.id === id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    if (locationType === 'headquarters') {
      if (ammunition[index].headquarters < quantity) {
        return res.status(400).json({ message: 'كمية غير كافية' });
      }
      ammunition[index].headquarters -= quantity;
    } else {
      const current = ammunition[index].distribution.platforms?.[locationId] || 0;
      if (current < quantity) return res.status(400).json({ message: 'كمية غير كافية على المنصة' });
      ammunition[index].distribution.platforms[locationId] -= quantity;
      ammunition[index].platforms -= quantity;
    }
    ammunition[index].total = ammunition[index].headquarters + ammunition[index].platforms;
    return res.json({ message: 'Scrapped' });
  }

  try {
    const item = await Ammunition.findById(id);
    if (!item) return res.status(404).json({ message: 'الذخيرة غير موجودة' });

    let platformCommander = null;
    let platformName = null;

    if (locationType === 'headquarters') {
      if (item.headquarters < quantity) {
        return res.status(400).json({ message: 'كمية غير كافية في المستودع' });
      }
      item.headquarters -= quantity;
    } else {
      const current = item.distribution.platforms?.[locationId] || 0;
      if (current < quantity) {
        return res.status(400).json({ message: 'كمية غير كافية على المنصة' });
      }
      const platform = await Platform.findOne({ id: locationId });
      if (platform) {
        platformName = platform.name;
        platformCommander = await getPlatformCommander(locationId);
      }
      item.distribution.platforms[locationId] -= quantity;
      if (item.distribution.platforms[locationId] === 0) {
        delete item.distribution.platforms[locationId];
      }
      item.platforms -= quantity;
    }
    item.total = item.headquarters + item.platforms;
    await item.save();

    // إشعارات
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);

    await createBulkNotifications(
      adminIds,
      `⚠️ إعدام ذخيرة: ${item.name}`,
      `تم إعدام ${quantity} من ${item.name}. السبب: ${reason}. ${locationType === 'headquarters' ? 'من المستودع' : `من منصة ${platformName || locationId}`}`,
      'system',
      { ammunitionId: item._id, name: item.name, quantity, reason, locationType, locationId }
    );

    if (platformCommander && locationType !== 'headquarters') {
      await createNotification(
        platformCommander._id,
        `⚠️ إعدام ذخيرة من منصتك: ${item.name}`,
        `تم إعدام ${quantity} من ${item.name} من منصتك. السبب: ${reason}`,
        'system',
        { ammunitionId: item._id, name: item.name, quantity, reason }
      );
    }

    if (io) {
      const notification = { title: `إعدام ذخيرة: ${item.name}`, message: `تم إعدام ${quantity} من ${item.name}`, read: false, createdAt: new Date() };
      adminIds.forEach(id => sendRealtimeNotification(io, id, notification));
      if (platformCommander && locationType !== 'headquarters') sendRealtimeNotification(io, platformCommander._id, notification);
    }

    res.json({ message: 'تم إعدام الذخيرة' });
  } catch (error) {
    console.error('Error scrapping ammunition:', error);
    res.status(500).json({ message: 'فشل الإعدام' });
  }
});

// ============== POST apply critical threshold to all ==============
router.post('/apply-critical-threshold', auth, async (req, res) => {
  const io = req.app.get('io');

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'غير مصرح بهذا الإجراء' });
  }

  const criticalThreshold = 50;

  if (isMockMode()) {
    const ammunition = global.mockDB?.ammunition || [];
    ammunition.forEach(a => { a.minThreshold = criticalThreshold; });
    return res.json({ message: 'Applied critical threshold to all' });
  }

  try {
    await Ammunition.updateMany({}, { minThreshold: criticalThreshold });
    
    // إشعار للمسؤولين
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    await createBulkNotifications(
      adminIds,
      `⚙️ تطبيق الحد الحرج على جميع الذخائر`,
      `تم تطبيق الحد الحرج (${criticalThreshold}) على جميع أصناف الذخائر في النظام`,
      'system',
      { threshold: criticalThreshold }
    );
    
    res.json({ message: 'تم تطبيق الحد الحرج على جميع الذخائر' });
  } catch (error) {
    console.error('Error applying critical threshold:', error);
    res.status(500).json({ message: 'فشل التطبيق' });
  }
});

module.exports = router;