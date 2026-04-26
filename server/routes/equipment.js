const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Equipment = require('../models/Equipment');
const Platform = require('../models/Platform');
const { createNotification, createBulkNotifications, sendRealtimeNotification } = require('../services/notificationService');
const User = require('../models/User');

const isMockMode = () => process.env.USE_MOCK_DB === 'true';

// Helper functions for notifications
const getAdminUsers = async () => {
  return await User.find({ role: 'admin' }).select('_id');
};

const getPlatformCommander = async (platformName) => {
  const platform = await Platform.findOne({ name: platformName });
  if (!platform) return null;
  return await User.findOne({ role: 'platformCommander', assignedPlatformId: platform.id });
};

// ============== GET all equipment ==============
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 10, search = '', status = '', type = '' } = req.query;

  if (isMockMode()) {
    let data = global.mockDB?.equipment || [];
    if (search) data = data.filter(e => e.name.includes(search) || e.model.includes(search) || e.serialNumber.includes(search));
    if (status) data = data.filter(e => e.status === status);
    if (type) data = data.filter(e => e.type === type);
    const start = (page - 1) * limit;
    const paginated = data.slice(start, start + limit);
    return res.json({
      data: paginated,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(data.length / limit),
        total: data.length,
        limit: parseInt(limit)
      }
    });
  }

  try {
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (type) query.type = type;

    const data = await Equipment.find(query)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Equipment.countDocuments(query);

    res.json({
      data,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ message: 'خطأ في تحميل المعدات' });
  }
});

// ============== GET grouped equipment ==============
router.get('/grouped', auth, async (req, res) => {
  const { search = '', status = '', type = '' } = req.query;

  if (isMockMode()) {
    let data = global.mockDB?.equipment || [];
    if (search) data = data.filter(e => e.name.includes(search) || e.model.includes(search));
    if (status) data = data.filter(e => e.status === status);
    if (type) data = data.filter(e => e.type === type);

    const groups = {};
    data.forEach(item => {
      const key = `${item.name}_${item.model}`;
      if (!groups[key]) {
        groups[key] = {
          name: item.name,
          model: item.model,
          type: item.type,
          total: 0,
          items: []
        };
      }
      groups[key].total++;
      groups[key].items.push(item);
    });
    return res.json(Object.values(groups));
  }

  try {
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (type) query.type = type;

    const data = await Equipment.find(query).sort({ createdAt: -1 });

    const groups = {};
    data.forEach(item => {
      const key = `${item.name}_${item.model}`;
      if (!groups[key]) {
        groups[key] = {
          name: item.name,
          model: item.model,
          type: item.type,
          total: 0,
          items: []
        };
      }
      groups[key].total++;
      groups[key].items.push(item);
    });
    res.json(Object.values(groups));
  } catch (error) {
    console.error('Error fetching grouped equipment:', error);
    res.status(500).json({ message: 'خطأ في تحميل المعدات' });
  }
});

// ============== GET critical equipment ==============
router.get('/critical', auth, async (req, res) => {
  const threshold = 5;

  if (isMockMode()) {
    const data = global.mockDB?.equipment || [];
    const counts = {};
    data.forEach(item => {
      const key = `${item.name}_${item.model}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    const critical = Object.entries(counts)
      .filter(([_, count]) => count <= threshold)
      .map(([key]) => {
        const [name, model] = key.split('_');
        return { name, model, quantity: counts[key], threshold };
      });
    return res.json(critical);
  }

  try {
    const data = await Equipment.find();
    const counts = {};
    data.forEach(item => {
      const key = `${item.name}_${item.model}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    const critical = Object.entries(counts)
      .filter(([_, count]) => count <= threshold)
      .map(([key, count]) => {
        const [name, model] = key.split('_');
        return { name, model, quantity: count, threshold };
      });
    res.json(critical);
  } catch (error) {
    console.error('Error fetching critical equipment:', error);
    res.status(500).json({ message: 'خطأ في تحميل المعدات الحرجة' });
  }
});

// ============== GET workshop equipment ==============
router.get('/workshop', auth, async (req, res) => {
  const { search = '', sourcePlatform = '' } = req.query;

  if (isMockMode()) {
    let data = global.mockDB?.equipment?.filter(e => e.status === 'في الصيانة') || [];
    if (search) data = data.filter(e => e.name.includes(search) || e.model.includes(search) || e.serialNumber.includes(search));
    if (sourcePlatform) data = data.filter(e => e.fromPlatform?.includes(sourcePlatform));

    const groups = {};
    data.forEach(item => {
      const key = `${item.name}_${item.model}`;
      if (!groups[key]) {
        groups[key] = {
          name: item.name,
          model: item.model,
          type: item.type,
          total: 0,
          items: []
        };
      }
      groups[key].total++;
      groups[key].items.push(item);
    });
    return res.json(Object.values(groups));
  }

  try {
    const query = { status: 'في الصيانة' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } }
      ];
    }
    if (sourcePlatform) query.fromPlatform = { $regex: sourcePlatform, $options: 'i' };

    const data = await Equipment.find(query).sort({ createdAt: -1 });

    const groups = {};
    data.forEach(item => {
      const key = `${item.name}_${item.model}`;
      if (!groups[key]) {
        groups[key] = {
          name: item.name,
          model: item.model,
          type: item.type,
          total: 0,
          items: []
        };
      }
      groups[key].total++;
      groups[key].items.push(item);
    });
    res.json(Object.values(groups));
  } catch (error) {
    console.error('Error fetching workshop equipment:', error);
    res.status(500).json({ message: 'خطأ في تحميل معدات الورشة' });
  }
});

// ============== GET single equipment ==============
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (isMockMode()) {
    const data = global.mockDB?.equipment || [];
    const item = data.find(e => e.id === id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json(item);
  }

  try {
    const item = await Equipment.findById(id);
    if (!item) return res.status(404).json({ message: 'المعدة غير موجودة' });
    res.json(item);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// ============== POST create equipment ==============
router.post('/', auth, async (req, res) => {
  const { name, model, type, serialNumber, notes } = req.body;
  if (!name || !model || !serialNumber) {
    return res.status(400).json({ message: 'الاسم والموديل والرقم التسلسلي مطلوبة' });
  }

  if (isMockMode()) {
    const newItem = {
      id: Date.now().toString(),
      name,
      model,
      type: type || 'قتالية',
      serialNumber,
      notes: notes || '',
      status: 'جاهزة',
      location: 'headquarters',
      createdAt: new Date().toISOString()
    };
    if (!global.mockDB.equipment) global.mockDB.equipment = [];
    global.mockDB.equipment.push(newItem);
    return res.status(201).json(newItem);
  }

  try {
    const existing = await Equipment.findOne({ serialNumber });
    if (existing) {
      return res.status(400).json({ message: 'الرقم التسلسلي موجود مسبقاً' });
    }
    const newItem = new Equipment({
      name,
      model,
      type: type || 'قتالية',
      serialNumber,
      notes: notes || '',
      status: 'جاهزة',
      location: 'headquarters'
    });
    const saved = await newItem.save();
    console.log('✅ Equipment saved:', saved._id);
    
    // إشعار للمسؤولين
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    await createBulkNotifications(
      adminIds,
      `➕ إضافة معدة جديدة: ${name}`,
      `تم إضافة معدة جديدة ${name} (${serialNumber}) إلى المستودع`,
      'assignment',
      { equipmentId: saved._id, name, serialNumber }
    );
    
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error saving equipment:', error);
    res.status(500).json({ message: 'فشل إضافة المعدة' });
  }
});

// ============== POST bulk add equipment ==============
router.post('/bulk', auth, async (req, res) => {
  const { name, model, type, count, serialPrefix } = req.body;
  if (!name || !model || !count || !serialPrefix) {
    return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
  }

  if (isMockMode()) {
    const newItems = [];
    for (let i = 1; i <= count; i++) {
      newItems.push({
        id: Date.now().toString() + i,
        name,
        model,
        type: type || 'قتالية',
        serialNumber: `${serialPrefix}${i}`,
        notes: '',
        status: 'جاهزة',
        location: 'headquarters',
        createdAt: new Date().toISOString()
      });
    }
    if (!global.mockDB.equipment) global.mockDB.equipment = [];
    global.mockDB.equipment.push(...newItems);
    return res.status(201).json({ message: `Added ${count} items`, items: newItems });
  }

  try {
    const newItems = [];
    for (let i = 1; i <= count; i++) {
      const serialNumber = `${serialPrefix}${i}`;
      const existing = await Equipment.findOne({ serialNumber });
      if (existing) {
        return res.status(400).json({ message: `الرقم التسلسلي ${serialNumber} موجود مسبقاً` });
      }
      const newItem = new Equipment({
        name,
        model,
        type: type || 'قتالية',
        serialNumber,
        notes: '',
        status: 'جاهزة',
        location: 'headquarters'
      });
      const saved = await newItem.save();
      newItems.push(saved);
    }
    console.log(`✅ Bulk added ${count} equipment items`);
    
    // إشعار للمسؤولين
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    await createBulkNotifications(
      adminIds,
      `➕ إضافة ${count} قطع من ${name}`,
      `تم إضافة ${count} قطعة من ${name} إلى المستودع`,
      'assignment',
      { name, count }
    );
    
    res.status(201).json({ message: `تم إضافة ${count} قطعة`, items: newItems });
  } catch (error) {
    console.error('Error bulk adding equipment:', error);
    res.status(500).json({ message: 'فشل إضافة المعدات' });
  }
});

// ============== PUT update equipment ==============
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { name, model, type, serialNumber, notes } = req.body;

  if (isMockMode()) {
    const equipment = global.mockDB?.equipment || [];
    const index = equipment.findIndex(e => e.id === id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    equipment[index] = { ...equipment[index], name, model, type, serialNumber, notes };
    return res.json(equipment[index]);
  }

  try {
    const updated = await Equipment.findByIdAndUpdate(
      id,
      { name, model, type, serialNumber, notes, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'المعدة غير موجودة' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ message: 'فشل التحديث' });
  }
});

// ============== DELETE equipment ==============
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (isMockMode()) {
    global.mockDB.equipment = global.mockDB?.equipment?.filter(e => e.id !== id) || [];
    return res.json({ message: 'Deleted' });
  }

  try {
    const deleted = await Equipment.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'المعدة غير موجودة' });
    
    // إشعار للمسؤولين
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    await createBulkNotifications(
      adminIds,
      `🗑️ حذف معدة: ${deleted.name}`,
      `تم حذف المعدة ${deleted.name} (${deleted.serialNumber})`,
      'assignment',
      { equipmentId: deleted._id, name: deleted.name, serialNumber: deleted.serialNumber }
    );
    
    res.json({ message: 'تم الحذف' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ message: 'فشل الحذف' });
  }
});

// ============== POST distribute equipment ==============
router.post('/distribute/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { platformName } = req.body;
  const io = req.app.get('io');

  if (isMockMode()) {
    const equipment = global.mockDB?.equipment || [];
    const index = equipment.findIndex(e => e.id === id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    if (equipment[index].status !== 'جاهزة') {
      return res.status(400).json({ message: 'المعدة غير متوفرة' });
    }
    equipment[index].status = 'موزعة';
    equipment[index].location = platformName;
    return res.json({ message: `Distributed to ${platformName}` });
  }

  try {
    const item = await Equipment.findById(id);
    if (!item) return res.status(404).json({ message: 'المعدة غير موجودة' });
    if (item.status !== 'جاهزة') {
      return res.status(400).json({ message: 'المعدة غير متوفرة للتوزيع' });
    }
    
    const oldLocation = item.location;
    item.status = 'موزعة';
    item.location = platformName;
    await item.save();
    
    // إشعارات
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    const platformCommander = await getPlatformCommander(platformName);
    
    await createBulkNotifications(
      adminIds,
      `📦 توزيع معدة: ${item.name}`,
      `تم توزيع المعدة ${item.name} (${item.serialNumber}) إلى ${platformName}`,
      'assignment',
      { equipmentId: item._id, name: item.name, serialNumber: item.serialNumber, platform: platformName }
    );
    
    if (platformCommander) {
      await createNotification(
        platformCommander._id,
        `📦 معدة جديدة على منصتك: ${item.name}`,
        `تم توزيع ${item.name} (${item.serialNumber}) إلى منصتك`,
        'assignment',
        { equipmentId: item._id, name: item.name, serialNumber: item.serialNumber }
      );
    }
    
    if (io) {
      const notification = { title: `توزيع معدة: ${item.name}`, message: `تم توزيع ${item.name} إلى ${platformName}`, read: false, createdAt: new Date() };
      adminIds.forEach(id => sendRealtimeNotification(io, id, notification));
      if (platformCommander) sendRealtimeNotification(io, platformCommander._id, notification);
    }
    
    res.json({ message: `تم توزيع المعدة إلى ${platformName}` });
  } catch (error) {
    console.error('Error distributing equipment:', error);
    res.status(500).json({ message: 'فشل التوزيع' });
  }
});

// ============== POST return equipment ==============
router.post('/return/:id', auth, async (req, res) => {
  const { id } = req.params;
  const io = req.app.get('io');

  if (isMockMode()) {
    const equipment = global.mockDB?.equipment || [];
    const index = equipment.findIndex(e => e.id === id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    equipment[index].status = 'جاهزة';
    equipment[index].location = 'headquarters';
    return res.json({ message: 'Returned to headquarters' });
  }

  try {
    const item = await Equipment.findById(id);
    if (!item) return res.status(404).json({ message: 'المعدة غير موجودة' });
    
    const oldLocation = item.location;
    item.status = 'جاهزة';
    item.location = 'headquarters';
    await item.save();
    
    // إشعارات
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    
    await createBulkNotifications(
      adminIds,
      `↩️ إعادة معدة: ${item.name}`,
      `تم إعادة المعدة ${item.name} (${item.serialNumber}) من ${oldLocation} إلى المستودع`,
      'assignment',
      { equipmentId: item._id, name: item.name, serialNumber: item.serialNumber, fromPlatform: oldLocation }
    );
    
    if (io) {
      const notification = { title: `إعادة معدة: ${item.name}`, message: `تم إعادة ${item.name} إلى المستودع`, read: false, createdAt: new Date() };
      adminIds.forEach(id => sendRealtimeNotification(io, id, notification));
    }
    
    res.json({ message: 'تم إعادة المعدة إلى المستودع' });
  } catch (error) {
    console.error('Error returning equipment:', error);
    res.status(500).json({ message: 'فشل الإعادة' });
  }
});

// ============== POST send to workshop ==============
router.post('/send-to-workshop/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { faultDescription } = req.body;
  const io = req.app.get('io');

  if (isMockMode()) {
    const equipment = global.mockDB?.equipment || [];
    const index = equipment.findIndex(e => e.id === id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    equipment[index].status = 'في الصيانة';
    equipment[index].location = 'workshop';
    equipment[index].faultDescription = faultDescription;
    equipment[index].receivedDate = new Date().toISOString();
    return res.json({ message: 'Sent to workshop' });
  }

  try {
    const item = await Equipment.findById(id);
    if (!item) return res.status(404).json({ message: 'المعدة غير موجودة' });
    
    const oldLocation = item.location;
    item.status = 'في الصيانة';
    item.location = 'workshop';
    item.faultDescription = faultDescription;
    item.receivedDate = new Date();
    await item.save();
    
    // إشعارات
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    
    let platformCommander = null;
    if (oldLocation !== 'headquarters') {
      platformCommander = await getPlatformCommander(oldLocation);
    }
    
    await createBulkNotifications(
      adminIds,
      `🔧 إرسال معدة للورشة: ${item.name}`,
      `تم إرسال المعدة ${item.name} (${item.serialNumber}) إلى الورشة. العطل: ${faultDescription}`,
      'workshop',
      { equipmentId: item._id, name: item.name, serialNumber: item.serialNumber, faultDescription }
    );
    
    if (platformCommander) {
      await createNotification(
        platformCommander._id,
        `🔧 إرسال معدة من منصتك للورشة: ${item.name}`,
        `تم إرسال المعدة ${item.name} (${item.serialNumber}) من منصتك إلى الورشة. العطل: ${faultDescription}`,
        'workshop',
        { equipmentId: item._id, name: item.name, serialNumber: item.serialNumber, faultDescription }
      );
    }
    
    if (io) {
      const notification = { title: `إرسال للورشة: ${item.name}`, message: `تم إرسال ${item.name} إلى الورشة`, read: false, createdAt: new Date() };
      adminIds.forEach(id => sendRealtimeNotification(io, id, notification));
      if (platformCommander) sendRealtimeNotification(io, platformCommander._id, notification);
    }
    
    res.json({ message: 'تم إرسال المعدة إلى الورشة' });
  } catch (error) {
    console.error('Error sending to workshop:', error);
    res.status(500).json({ message: 'فشل الإرسال إلى الورشة' });
  }
});

// ============== POST return from workshop ==============
router.post('/return-from-workshop/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { repairNotes } = req.body;
  const io = req.app.get('io');

  if (isMockMode()) {
    const equipment = global.mockDB?.equipment || [];
    const index = equipment.findIndex(e => e.id === id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    equipment[index].status = 'جاهزة';
    equipment[index].location = 'headquarters';
    equipment[index].repairNotes = repairNotes;
    equipment[index].repairedDate = new Date().toISOString();
    return res.json({ message: 'Returned from workshop' });
  }

  try {
    const item = await Equipment.findById(id);
    if (!item) return res.status(404).json({ message: 'المعدة غير موجودة' });
    
    item.status = 'جاهزة';
    item.location = 'headquarters';
    item.repairNotes = repairNotes;
    item.repairedDate = new Date();
    await item.save();
    
    // إشعارات
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    
    await createBulkNotifications(
      adminIds,
      `✅ إعادة معدة من الورشة: ${item.name}`,
      `تم إعادة المعدة ${item.name} (${item.serialNumber}) من الورشة إلى المستودع. ملاحظات: ${repairNotes || 'لا توجد'}`,
      'workshop',
      { equipmentId: item._id, name: item.name, serialNumber: item.serialNumber, repairNotes }
    );
    
    if (io) {
      const notification = { title: `إعادة من الورشة: ${item.name}`, message: `تم إعادة ${item.name} من الورشة`, read: false, createdAt: new Date() };
      adminIds.forEach(id => sendRealtimeNotification(io, id, notification));
    }
    
    res.json({ message: 'تم إعادة المعدة من الورشة' });
  } catch (error) {
    console.error('Error returning from workshop:', error);
    res.status(500).json({ message: 'فشل الإعادة من الورشة' });
  }
});

// ============== POST retire equipment ==============
router.post('/retire/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const io = req.app.get('io');

  if (isMockMode()) {
    const equipment = global.mockDB?.equipment || [];
    const index = equipment.findIndex(e => e.id === id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    equipment[index].status = 'خارج الخدمة';
    equipment[index].location = 'retired';
    equipment[index].retireReason = reason;
    equipment[index].retiredDate = new Date().toISOString();
    return res.json({ message: 'Equipment retired' });
  }

  try {
    const item = await Equipment.findById(id);
    if (!item) return res.status(404).json({ message: 'المعدة غير موجودة' });
    
    const oldLocation = item.location;
    item.status = 'خارج الخدمة';
    item.location = 'retired';
    item.retireReason = reason;
    item.retiredDate = new Date();
    await item.save();
    
    // إشعارات
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    
    await createBulkNotifications(
      adminIds,
      `⚠️ إخراج معدة من الخدمة: ${item.name}`,
      `تم إخراج المعدة ${item.name} (${item.serialNumber}) من الخدمة. السبب: ${reason}`,
      'workshop',
      { equipmentId: item._id, name: item.name, serialNumber: item.serialNumber, reason, oldLocation }
    );
    
    if (io) {
      const notification = { title: `إخراج من الخدمة: ${item.name}`, message: `تم إخراج ${item.name} من الخدمة`, read: false, createdAt: new Date() };
      adminIds.forEach(id => sendRealtimeNotification(io, id, notification));
    }
    
    res.json({ message: 'تم إخراج المعدة من الخدمة' });
  } catch (error) {
    console.error('Error retiring equipment:', error);
    res.status(500).json({ message: 'فشل إخراج المعدة' });
  }
});

// ============== PUT update fault description ==============
router.put('/workshop/:id/fault', auth, async (req, res) => {
  const { id } = req.params;
  const { faultDescription } = req.body;

  if (isMockMode()) {
    const equipment = global.mockDB?.equipment || [];
    const index = equipment.findIndex(e => e.id === id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    equipment[index].faultDescription = faultDescription;
    return res.json({ message: 'Fault description updated' });
  }

  try {
    const item = await Equipment.findById(id);
    if (!item) return res.status(404).json({ message: 'المعدة غير موجودة' });
    item.faultDescription = faultDescription;
    await item.save();
    res.json({ message: 'تم تحديث وصف العطل' });
  } catch (error) {
    console.error('Error updating fault description:', error);
    res.status(500).json({ message: 'فشل التحديث' });
  }
});

module.exports = router;