const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Platform = require('../models/Platform');
const Officer = require('../models/Officer');
const NCO = require('../models/NCO');
const Recruit = require('../models/Recruit');
const Equipment = require('../models/Equipment');
const Ammunition = require('../models/Ammunition');
const { createNotification, createBulkNotifications, sendRealtimeNotification } = require('../services/notificationService');
const User = require('../models/User');

const isMockMode = () => process.env.USE_MOCK_DB === 'true';

// Helper functions for notifications
const getAdminUsers = async () => {
  return await User.find({ role: 'admin' }).select('_id');
};

const getPlatformCommander = async (platformId) => {
  const platform = await Platform.findOne({ id: platformId });
  if (!platform) return null;
  return await User.findOne({ role: 'platformCommander', assignedPlatformId: platform.id });
};

// ============== 1. الحصول على قائمة المنصات ==============
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 10, name, location, status, minPower, maxPower, sortBy, sortOrder } = req.query;

  if (isMockMode()) {
    let platforms = global.mockDB?.platforms || [];
    if (name) platforms = platforms.filter(p => p.name.includes(name));
    if (location) platforms = platforms.filter(p => p.location.includes(location));
    if (status) platforms = platforms.filter(p => p.status === status);
    const start = (page - 1) * limit;
    const paginated = platforms.slice(start, start + limit);
    return res.json({ data: paginated, pagination: { page: parseInt(page), pages: Math.ceil(platforms.length / limit), total: platforms.length, limit: parseInt(limit) } });
  }

  try {
    const query = {};
    if (name) query.name = { $regex: name, $options: 'i' };
    if (location) query.location = { $regex: location, $options: 'i' };
    if (status) query.status = status;

    let platformsQuery = Platform.find(query)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    if (sortBy === 'name') {
      platformsQuery = platformsQuery.sort({ name: sortOrder === 'asc' ? 1 : -1 });
    } else if (sortBy === 'status') {
      platformsQuery = platformsQuery.sort({ status: sortOrder === 'asc' ? 1 : -1 });
    } else {
      platformsQuery = platformsQuery.sort({ createdAt: -1 });
    }

    const platforms = await platformsQuery;
    const total = await Platform.countDocuments(query);

    // إحصائيات القوة لكل منصة
    const platformsWithStats = await Promise.all(platforms.map(async (platform) => {
      const officers = await Officer.find({ currentLocation: platform.name });
      const ncos = await NCO.find({ currentLocation: platform.name });
      const recruits = await Recruit.find({ currentLocation: platform.name });
      const allPersonnel = [...officers, ...ncos, ...recruits];
      
      const power = allPersonnel.length;
      const distribution = allPersonnel.filter(p => 
        !['present', 'distributed', 'student'].includes(p.attendanceStatus)
      ).length;
      const present = allPersonnel.filter(p => 
        ['present', 'distributed', 'student'].includes(p.attendanceStatus)
      ).length;

      return {
        ...platform.toObject(),
        personnelStats: { power, distribution, present }
      };
    }));

    res.json({
      data: platformsWithStats,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({ message: 'خطأ في تحميل المنصات' });
  }
});

// ============== 2. تفاصيل المنصة ==============
router.get('/:id/details', auth, async (req, res) => {
  const { id } = req.params;

  if (isMockMode()) {
    const platform = global.mockDB?.platforms?.find(p => p.id === id);
    if (!platform) return res.status(404).json({ message: 'Platform not found' });
    return res.json({
      ...platform,
      equipmentCount: 0,
      ammunitionCount: 0,
      criticalEquipment: [],
      criticalAmmunition: [],
      upcomingRotations: []
    });
  }

  try {
    const platform = await Platform.findOne({ id });
    if (!platform) return res.status(404).json({ message: 'المنصة غير موجودة' });

    // إحصائيات الكوادر
    const officers = await Officer.find({ currentLocation: platform.name });
    const ncos = await NCO.find({ currentLocation: platform.name });
    const recruits = await Recruit.find({ currentLocation: platform.name });
    const allPersonnel = [...officers, ...ncos, ...recruits];
    
    const power = allPersonnel.length;
    const distribution = allPersonnel.filter(p => 
      !['present', 'distributed', 'student'].includes(p.attendanceStatus)
    ).length;
    const present = allPersonnel.filter(p => 
      ['present', 'distributed', 'student'].includes(p.attendanceStatus)
    ).length;

    // إحصائيات المعدات
    const equipment = await Equipment.find({ location: platform.name });
    const equipmentCount = equipment.length;
    
    // المعدات الحرجة
    const equipmentGroups = {};
    equipment.forEach(e => {
      const key = `${e.name}_${e.model}`;
      equipmentGroups[key] = (equipmentGroups[key] || 0) + 1;
    });
    const criticalEquipment = Object.entries(equipmentGroups)
      .filter(([_, count]) => count <= 5)
      .map(([key, count]) => {
        const [name, model] = key.split('_');
        return { name, model, quantity: count, threshold: 5 };
      });

    // إحصائيات الذخائر
    const allAmmunition = await Ammunition.find().lean();
    let ammunitionCount = 0;
    const criticalAmmunition = [];

    for (const a of allAmmunition) {
      const quantity = a.distribution?.platforms?.[platform.id] || 
                       a.distribution?.platforms?.[platform._id.toString()] || 0;
      
      if (quantity > 0) {
        ammunitionCount += quantity;
        if (quantity <= a.minThreshold) {
          criticalAmmunition.push({
            id: a._id,
            name: a.name,
            quantity,
            minThreshold: a.minThreshold
          });
        }
      }
    }

    // الاستحقاقات الوشيكة
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);
    
    const upcomingOfficers = await Officer.find({
      currentLocation: platform.name,
      rotationEndDate: { $gte: today, $lte: futureDate }
    });
    const upcomingNcos = await NCO.find({
      currentLocation: platform.name,
      rotationEndDate: { $gte: today, $lte: futureDate }
    });
    const upcomingRecruits = await Recruit.find({
      currentLocation: platform.name,
      rotationEndDate: { $gte: today, $lte: futureDate }
    });
    
    const allUpcoming = [...upcomingOfficers, ...upcomingNcos, ...upcomingRecruits];
    const upcomingRotations = allUpcoming.map(p => ({
      id: p._id,
      name: p.name,
      rank: p.rank,
      endDate: p.rotationEndDate,
      remainingDays: Math.ceil((p.rotationEndDate - today) / (1000 * 60 * 60 * 24))
    })).sort((a, b) => a.remainingDays - b.remainingDays);

    res.json({
      ...platform.toObject(),
      personnelStats: { power, distribution, present },
      equipmentCount,
      ammunitionCount,
      criticalEquipment,
      criticalAmmunition,
      upcomingRotations
    });
  } catch (error) {
    console.error('Error fetching platform details:', error);
    res.status(500).json({ message: 'خطأ في تحميل تفاصيل المنصة' });
  }
});

// ============== 3. جلب كوادر المنصة ==============
router.get('/:id/personnel', auth, async (req, res) => {
  const { id } = req.params;
  const { search = '' } = req.query;

  if (isMockMode()) {
    const platform = global.mockDB?.platforms?.find(p => p.id === id);
    if (!platform) return res.status(404).json({ message: 'Platform not found' });
    let personnel = [
      ...(global.mockDB?.officers?.filter(p => p.currentLocation === platform.name) || []),
      ...(global.mockDB?.ncos?.filter(p => p.currentLocation === platform.name) || []),
      ...(global.mockDB?.recruits?.filter(p => p.currentLocation === platform.name) || [])
    ];
    if (search) {
      personnel = personnel.filter(p => p.name.includes(search) || p.militaryId?.includes(search));
    }
    return res.json(personnel);
  }

  try {
    const platform = await Platform.findOne({ id });
    if (!platform) return res.status(404).json({ message: 'المنصة غير موجودة' });

    let query = { currentLocation: platform.name };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { militaryId: { $regex: search, $options: 'i' } }
      ];
    }

    const officers = await Officer.find(query);
    const ncos = await NCO.find(query);
    const recruits = await Recruit.find(query);
    
    let allPersonnel = [...officers, ...ncos, ...recruits];
    allPersonnel = allPersonnel.map(p => ({
      ...p.toObject(),
      type: p.constructor.modelName.toLowerCase() === 'officer' ? 'officers' :
            p.constructor.modelName.toLowerCase() === 'nco' ? 'ncos' : 'recruits'
    }));

    res.json(allPersonnel);
  } catch (error) {
    console.error('Error fetching platform personnel:', error);
    res.status(500).json({ message: 'خطأ في تحميل كوادر المنصة' });
  }
});

// ============== 4. جلب معدات المنصة ==============
router.get('/:id/equipment', auth, async (req, res) => {
  const { id } = req.params;

  if (isMockMode()) {
    const platform = global.mockDB?.platforms?.find(p => p.id === id);
    if (!platform) return res.status(404).json({ message: 'Platform not found' });
    const equipment = (global.mockDB?.equipment || []).filter(e => e.location === platform.name);
    return res.json(equipment);
  }

  try {
    const platform = await Platform.findOne({ id });
    if (!platform) return res.status(404).json({ message: 'المنصة غير موجودة' });
    const equipment = await Equipment.find({ location: platform.name });
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching platform equipment:', error);
    res.status(500).json({ message: 'خطأ في تحميل معدات المنصة' });
  }
});

// ============== 5. جلب ذخائر المنصة ==============
router.get('/:id/ammunition', auth, async (req, res) => {
  const { id } = req.params;

  if (isMockMode()) {
    const platform = global.mockDB?.platforms?.find(p => p.id === id);
    if (!platform) return res.status(404).json({ message: 'Platform not found' });
    const ammunition = (global.mockDB?.ammunition || []).map(a => ({
      id: a.id,
      name: a.name,
      caliber: a.caliber,
      type: a.type,
      quantity: a.distribution?.platforms?.[platform.id] || 0,
      minThreshold: a.minThreshold
    })).filter(a => a.quantity > 0);
    return res.json(ammunition);
  }

  try {
    const platform = await Platform.findOne({ id });
    if (!platform) return res.status(404).json({ message: 'المنصة غير موجودة' });
    
    const allAmmunition = await Ammunition.find().lean();
    const ammunition = [];
    
    for (const a of allAmmunition) {
      let quantity = 0;
      
      if (a.distribution && a.distribution.platforms) {
        quantity = a.distribution.platforms[platform.id] || 
                   a.distribution.platforms[platform._id.toString()] || 0;
      }
      
      if (quantity > 0) {
        ammunition.push({
          id: a._id,
          name: a.name,
          caliber: a.caliber,
          type: a.type,
          quantity,
          minThreshold: a.minThreshold
        });
      }
    }
    
    res.json(ammunition);
  } catch (error) {
    console.error('Error fetching platform ammunition:', error);
    res.status(500).json({ message: 'خطأ في تحميل ذخائر المنصة' });
  }
});

// ============== 6. إنشاء منصة جديدة ==============
router.post('/', auth, async (req, res) => {
  const { name, location, maxPersonnel, maxEquipment } = req.body;
  const io = req.app.get('io');
  
  if (!name || !location) {
    return res.status(400).json({ message: 'الاسم والموقع مطلوبان' });
  }

  if (isMockMode()) {
    const newPlatform = { 
      id: Date.now().toString(), 
      name, 
      location, 
      status: 'active', 
      maxPersonnel, 
      maxEquipment, 
      personnelStats: { power: 0, distribution: 0, present: 0 } 
    };
    if (!global.mockDB.platforms) global.mockDB.platforms = [];
    global.mockDB.platforms.push(newPlatform);
    
    // إشعارات
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    await createBulkNotifications(
      adminIds,
      `🏢 منصة جديدة: ${name}`,
      `تم إنشاء منصة جديدة باسم ${name} في ${location}`,
      'platformAlert',
      { platformId: newPlatform.id, platformName: name, location }
    );
    
    return res.status(201).json(newPlatform);
  }

  try {
    const existingPlatform = await Platform.findOne({ name });
    if (existingPlatform) {
      return res.status(400).json({ message: 'منصة بنفس الاسم موجودة بالفعل' });
    }
    
    const newPlatform = new Platform({
      id: Date.now().toString(),
      name,
      location,
      status: 'active',
      maxPersonnel: maxPersonnel || null,
      maxEquipment: maxEquipment || null
    });
    const saved = await newPlatform.save();
    
    // إشعارات
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    await createBulkNotifications(
      adminIds,
      `🏢 منصة جديدة: ${name}`,
      `تم إنشاء منصة جديدة باسم ${name} في ${location}`,
      'platformAlert',
      { platformId: saved.id, platformName: name, location }
    );
    
    if (io) {
      const notification = { title: `منصة جديدة: ${name}`, message: `تم إنشاء منصة جديدة`, read: false, createdAt: new Date() };
      adminIds.forEach(id => sendRealtimeNotification(io, id, notification));
    }
    
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating platform:', error);
    res.status(500).json({ message: 'فشل إنشاء المنصة' });
  }
});

// ============== 7. تحديث منصة ==============
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (isMockMode()) {
    const platforms = global.mockDB?.platforms || [];
    const index = platforms.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    platforms[index] = { ...platforms[index], ...req.body };
    return res.json(platforms[index]);
  }

  try {
    const updated = await Platform.findOneAndUpdate(
      { id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'المنصة غير موجودة' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating platform:', error);
    res.status(500).json({ message: 'فشل تحديث المنصة' });
  }
});

// ============== 8. حذف منصة ==============
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (isMockMode()) {
    global.mockDB.platforms = global.mockDB?.platforms?.filter(p => p.id !== id) || [];
    return res.json({ message: 'Deleted' });
  }

  try {
    const deleted = await Platform.findOneAndDelete({ id });
    if (!deleted) return res.status(404).json({ message: 'المنصة غير موجودة' });
    res.json({ message: 'تم حذف المنصة' });
  } catch (error) {
    console.error('Error deleting platform:', error);
    res.status(500).json({ message: 'فشل حذف المنصة' });
  }
});

// ============== 9. تعطيل منصة ==============
router.post('/:id/disable', auth, async (req, res) => {
  const { id } = req.params;
  const io = req.app.get('io');

  if (isMockMode()) {
    const platforms = global.mockDB?.platforms || [];
    const index = platforms.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    const oldStatus = platforms[index].status;
    platforms[index].status = 'inactive';
    
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    const platformCommander = await getPlatformCommander(id);
    
    await createBulkNotifications(
      adminIds,
      `⚠️ تعطيل منصة: ${platforms[index].name}`,
      `تم تعطيل منصة ${platforms[index].name}. سيتم إعادة جميع الكوادر والمعدات والذخائر إلى الرئاسة`,
      'platformAlert',
      { platformId: id, platformName: platforms[index].name }
    );
    
    if (platformCommander) {
      await createNotification(
        platformCommander._id,
        `⚠️ تعطيل منصتك: ${platforms[index].name}`,
        `تم تعطيل منصة ${platforms[index].name}. سيتم إعادة جميع الكوادر والمعدات والذخائر إلى الرئاسة`,
        'platformAlert',
        { platformId: id, platformName: platforms[index].name }
      );
    }
    
    return res.json({ message: 'Platform disabled' });
  }

  try {
    const platform = await Platform.findOne({ id });
    if (!platform) return res.status(404).json({ message: 'المنصة غير موجودة' });
    
    const oldStatus = platform.status;
    platform.status = 'inactive';
    await platform.save();
    
    // إشعارات
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    const platformCommander = await getPlatformCommander(id);
    
    await createBulkNotifications(
      adminIds,
      `⚠️ تعطيل منصة: ${platform.name}`,
      `تم تعطيل منصة ${platform.name}. سيتم إعادة جميع الكوادر والمعدات والذخائر إلى الرئاسة`,
      'platformAlert',
      { platformId: id, platformName: platform.name }
    );
    
    if (platformCommander) {
      await createNotification(
        platformCommander._id,
        `⚠️ تعطيل منصتك: ${platform.name}`,
        `تم تعطيل منصة ${platform.name}. سيتم إعادة جميع الكوادر والمعدات والذخائر إلى الرئاسة`,
        'platformAlert',
        { platformId: id, platformName: platform.name }
      );
    }
    
    if (io) {
      const notification = { title: `تعطيل منصة: ${platform.name}`, message: `تم تعطيل منصة ${platform.name}`, read: false, createdAt: new Date() };
      adminIds.forEach(id => sendRealtimeNotification(io, id, notification));
      if (platformCommander) sendRealtimeNotification(io, platformCommander._id, notification);
    }
    
    res.json({ message: 'تم تعطيل المنصة' });
  } catch (error) {
    console.error('Error disabling platform:', error);
    res.status(500).json({ message: 'فشل تعطيل المنصة' });
  }
});

// ============== 10. تفعيل منصة ==============
router.post('/:id/enable', auth, async (req, res) => {
  const { id } = req.params;
  const io = req.app.get('io');

  if (isMockMode()) {
    const platforms = global.mockDB?.platforms || [];
    const index = platforms.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    platforms[index].status = 'active';
    
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    const platformCommander = await getPlatformCommander(id);
    
    await createBulkNotifications(
      adminIds,
      `✅ تفعيل منصة: ${platforms[index].name}`,
      `تم تفعيل منصة ${platforms[index].name}`,
      'platformAlert',
      { platformId: id, platformName: platforms[index].name }
    );
    
    if (platformCommander) {
      await createNotification(
        platformCommander._id,
        `✅ تفعيل منصتك: ${platforms[index].name}`,
        `تم تفعيل منصة ${platforms[index].name}`,
        'platformAlert',
        { platformId: id, platformName: platforms[index].name }
      );
    }
    
    return res.json({ message: 'Platform enabled' });
  }

  try {
    const platform = await Platform.findOne({ id });
    if (!platform) return res.status(404).json({ message: 'المنصة غير موجودة' });
    
    platform.status = 'active';
    await platform.save();
    
    // إشعارات
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    const platformCommander = await getPlatformCommander(id);
    
    await createBulkNotifications(
      adminIds,
      `✅ تفعيل منصة: ${platform.name}`,
      `تم تفعيل منصة ${platform.name}`,
      'platformAlert',
      { platformId: id, platformName: platform.name }
    );
    
    if (platformCommander) {
      await createNotification(
        platformCommander._id,
        `✅ تفعيل منصتك: ${platform.name}`,
        `تم تفعيل منصة ${platform.name}`,
        'platformAlert',
        { platformId: id, platformName: platform.name }
      );
    }
    
    if (io) {
      const notification = { title: `تفعيل منصة: ${platform.name}`, message: `تم تفعيل منصة ${platform.name}`, read: false, createdAt: new Date() };
      adminIds.forEach(id => sendRealtimeNotification(io, id, notification));
      if (platformCommander) sendRealtimeNotification(io, platformCommander._id, notification);
    }
    
    res.json({ message: 'تم تفعيل المنصة' });
  } catch (error) {
    console.error('Error enabling platform:', error);
    res.status(500).json({ message: 'فشل تفعيل المنصة' });
  }
});

// ============== 11. نقل كادر بين منصتين ==============
router.post('/transfer-personnel', auth, async (req, res) => {
  const { type, id, fromPlatformId, toPlatformId } = req.body;
  const io = req.app.get('io');

  try {
    let Model;
    if (type === 'officers') Model = Officer;
    else if (type === 'ncos') Model = NCO;
    else Model = Recruit;

    const personnel = await Model.findById(id);
    if (!personnel) return res.status(404).json({ message: 'الكادر غير موجود' });

    const toPlatform = await Platform.findOne({ id: toPlatformId });
    if (!toPlatform) return res.status(404).json({ message: 'المنصة الهدف غير موجودة' });

    const fromPlatformName = personnel.currentLocation;
    personnel.currentLocation = toPlatform.name;
    await personnel.save();

    // إشعارات
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    const fromCommander = await getPlatformCommander(fromPlatformId);
    const toCommander = await getPlatformCommander(toPlatformId);

    await createBulkNotifications(
      adminIds,
      `🔄 نقل كادر: ${personnel.name}`,
      `تم نقل ${personnel.name} (${personnel.rank}) من منصة ${fromPlatformName} إلى منصة ${toPlatform.name}`,
      'assignment',
      { personnelId: personnel._id, name: personnel.name, rank: personnel.rank, fromPlatform: fromPlatformName, toPlatform: toPlatform.name }
    );

    if (fromCommander) {
      await createNotification(
        fromCommander._id,
        `🔄 نقل كادر من منصتك: ${personnel.name}`,
        `تم نقل ${personnel.name} (${personnel.rank}) من منصتك إلى منصة ${toPlatform.name}`,
        'assignment',
        { personnelId: personnel._id, name: personnel.name, rank: personnel.rank, toPlatform: toPlatform.name }
      );
    }

    if (toCommander) {
      await createNotification(
        toCommander._id,
        `🔄 كادر جديد على منصتك: ${personnel.name}`,
        `تم نقل ${personnel.name} (${personnel.rank}) إلى منصتك`,
        'assignment',
        { personnelId: personnel._id, name: personnel.name, rank: personnel.rank }
      );
    }

    if (io) {
      const notification = { title: `نقل كادر: ${personnel.name}`, message: `تم نقل ${personnel.name} من ${fromPlatformName} إلى ${toPlatform.name}`, read: false, createdAt: new Date() };
      adminIds.forEach(id => sendRealtimeNotification(io, id, notification));
      if (fromCommander) sendRealtimeNotification(io, fromCommander._id, notification);
      if (toCommander) sendRealtimeNotification(io, toCommander._id, notification);
    }

    res.json({ message: 'تم نقل الكادر بنجاح' });
  } catch (error) {
    console.error('Error transferring personnel:', error);
    res.status(500).json({ message: 'فشل نقل الكادر' });
  }
});

// ============== 12. نقل معدة بين منصتين ==============
router.post('/transfer-equipment', auth, async (req, res) => {
  const { equipmentId, fromPlatformId, toPlatformId } = req.body;
  const io = req.app.get('io');

  try {
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) return res.status(404).json({ message: 'المعدة غير موجودة' });

    const toPlatform = await Platform.findOne({ id: toPlatformId });
    if (!toPlatform) return res.status(404).json({ message: 'المنصة الهدف غير موجودة' });

    const fromPlatformName = equipment.location;
    equipment.location = toPlatform.name;
    await equipment.save();

    // إشعارات
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    const toCommander = await getPlatformCommander(toPlatformId);

    await createBulkNotifications(
      adminIds,
      `🔄 نقل معدة: ${equipment.name}`,
      `تم نقل المعدة ${equipment.name} (${equipment.serialNumber}) من منصة ${fromPlatformName} إلى منصة ${toPlatform.name}`,
      'assignment',
      { equipmentId: equipment._id, name: equipment.name, serialNumber: equipment.serialNumber, fromPlatform: fromPlatformName, toPlatform: toPlatform.name }
    );

    if (toCommander) {
      await createNotification(
        toCommander._id,
        `🔄 معدة جديدة على منصتك: ${equipment.name}`,
        `تم نقل المعدة ${equipment.name} (${equipment.serialNumber}) إلى منصتك`,
        'assignment',
        { equipmentId: equipment._id, name: equipment.name, serialNumber: equipment.serialNumber }
      );
    }

    if (io) {
      const notification = { title: `نقل معدة: ${equipment.name}`, message: `تم نقل ${equipment.name} من ${fromPlatformName} إلى ${toPlatform.name}`, read: false, createdAt: new Date() };
      adminIds.forEach(id => sendRealtimeNotification(io, id, notification));
      if (toCommander) sendRealtimeNotification(io, toCommander._id, notification);
    }

    res.json({ message: 'تم نقل المعدة بنجاح' });
  } catch (error) {
    console.error('Error transferring equipment:', error);
    res.status(500).json({ message: 'فشل نقل المعدة' });
  }
});

module.exports = router;