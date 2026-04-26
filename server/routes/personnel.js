const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Officer = require('../models/Officer');
const NCO = require('../models/NCO');
const Recruit = require('../models/Recruit');
const Platform = require('../models/Platform');
const { createNotification, createBulkNotifications, sendRealtimeNotification } = require('../services/notificationService');
const User = require('../models/User');

const isMockMode = () => process.env.USE_MOCK_DB === 'true';

// Helper function to get model by type
const getModelByType = (type) => {
  switch (type) {
    case 'officers': return Officer;
    case 'ncos': return NCO;
    case 'recruits': return Recruit;
    default: return null;
  }
};

// Helper to get platform commander
const getPlatformCommander = async (platformId) => {
  return await User.findOne({ role: 'platformCommander', assignedPlatformId: platformId });
};

// Helper to get admin users
const getAdminUsers = async () => {
  return await User.find({ role: 'admin' }).select('_id');
};

// POST /api/personnel/assign - تعيين كادر على منصة
router.post('/assign', auth, async (req, res) => {
  const { type, id, platformId, startDate, endDate } = req.body;
  const io = req.app.get('io');

  if (!type || !id || !platformId || !startDate || !endDate) {
    return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
  }

  if (isMockMode()) {
    // Mock mode code...
    let personnel = null;
    if (type === 'officers') personnel = global.mockDB?.officers?.find(p => p.id === id);
    if (type === 'ncos') personnel = global.mockDB?.ncos?.find(p => p.id === id);
    if (type === 'recruits') personnel = global.mockDB?.recruits?.find(p => p.id === id);
    
    if (!personnel) return res.status(404).json({ message: 'الكادر غير موجود' });
    if (personnel.attendanceStatus !== 'present') {
      return res.status(400).json({ message: 'الكادر غير حاضر' });
    }

    const platform = global.mockDB?.platforms?.find(p => p.id === platformId);
    if (!platform) return res.status(404).json({ message: 'المنصة غير موجودة' });

    personnel.currentLocation = platform.name;
    personnel.rotationEndDate = endDate;
    personnel.platformId = platformId;

    if (platform.personnelStats) {
      platform.personnelStats.power += 1;
      platform.personnelStats.distribution += 1;
    }

    return res.json({ message: 'تم التعيين بنجاح' });
  }

  // Real MongoDB mode
  try {
    const Model = getModelByType(type);
    if (!Model) return res.status(400).json({ message: 'نوع الكادر غير صالح' });

    const personnel = await Model.findById(id);
    if (!personnel) return res.status(404).json({ message: 'الكادر غير موجود' });
    if (personnel.attendanceStatus !== 'present') {
      return res.status(400).json({ message: 'الكادر غير حاضر' });
    }

    const platform = await Platform.findOne({ id: platformId });
    if (!platform) return res.status(404).json({ message: 'المنصة غير موجودة' });

    personnel.currentLocation = platform.name;
    personnel.rotationEndDate = new Date(endDate);
    await personnel.save();

    // ✅ إرسال إشعارات
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    const platformCommander = await getPlatformCommander(platformId);
    
    // إشعار للمسؤولين
    await createBulkNotifications(
      adminIds,
      `✅ تعيين كادر: ${personnel.name}`,
      `تم تعيين ${personnel.name} (${personnel.rank}) على منصة ${platform.name}`,
      'assignment',
      { personnelId: personnel._id, name: personnel.name, rank: personnel.rank, platformId, platformName: platform.name, startDate, endDate }
    );
    
    // إشعار لقائد المنصة
    if (platformCommander) {
      await createNotification(
        platformCommander._id,
        `📌 كادر جديد على منصتك: ${personnel.name}`,
        `تم تعيين ${personnel.name} (${personnel.rank}) على منصة ${platform.name}`,
        'assignment',
        { personnelId: personnel._id, name: personnel.name, rank: personnel.rank, startDate, endDate }
      );
    }
    
    // إشعار فوري عبر Socket.io
    if (io) {
      const notification = { title: `تعيين كادر: ${personnel.name}`, message: `تم تعيين ${personnel.name} على منصة ${platform.name}`, read: false, createdAt: new Date() };
      adminIds.forEach(adminId => sendRealtimeNotification(io, adminId, notification));
      if (platformCommander) sendRealtimeNotification(io, platformCommander._id, notification);
    }

    res.json({ message: 'تم التعيين بنجاح' });
  } catch (error) {
    console.error('Error assigning personnel:', error);
    res.status(500).json({ message: 'فشل التعيين' });
  }
});

// POST /api/personnel/return - إعادة كادر من منصة إلى الرئاسة
router.post('/return', auth, async (req, res) => {
  const { type, id, platformId, reason, details } = req.body;
  const io = req.app.get('io');

  if (!type || !id || !platformId) {
    return res.status(400).json({ message: 'البيانات غير مكتملة' });
  }

  if (isMockMode()) {
    let personnel = null;
    if (type === 'officers') personnel = global.mockDB?.officers?.find(p => p.id === id);
    if (type === 'ncos') personnel = global.mockDB?.ncos?.find(p => p.id === id);
    if (type === 'recruits') personnel = global.mockDB?.recruits?.find(p => p.id === id);

    if (!personnel) return res.status(404).json({ message: 'الكادر غير موجود' });

    personnel.currentLocation = 'headquarters';
    personnel.rotationEndDate = null;
    personnel.platformId = null;

    return res.json({ message: 'تمت الإعادة بنجاح' });
  }

  try {
    const Model = getModelByType(type);
    if (!Model) return res.status(400).json({ message: 'نوع الكادر غير صالح' });

    const personnel = await Model.findById(id);
    if (!personnel) return res.status(404).json({ message: 'الكادر غير موجود' });

    const platformName = personnel.currentLocation;
    personnel.currentLocation = 'headquarters';
    personnel.rotationEndDate = null;
    await personnel.save();

    // ✅ إرسال إشعارات
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    const platformCommander = await getPlatformCommander(platformId);
    
    await createBulkNotifications(
      adminIds,
      `↩️ إعادة كادر: ${personnel.name}`,
      `تم إعادة ${personnel.name} (${personnel.rank}) من منصة ${platformName} إلى الرئاسة. السبب: ${reason || 'غير محدد'}`,
      'return',
      { personnelId: personnel._id, name: personnel.name, rank: personnel.rank, platformName, reason, details }
    );
    
    if (platformCommander) {
      await createNotification(
        platformCommander._id,
        `↩️ إعادة كادر من منصتك: ${personnel.name}`,
        `تم إعادة ${personnel.name} (${personnel.rank}) من منصتك إلى الرئاسة. السبب: ${reason || 'غير محدد'}`,
        'return',
        { personnelId: personnel._id, name: personnel.name, rank: personnel.rank, reason, details }
      );
    }
    
    if (io) {
      const notification = { title: `إعادة كادر: ${personnel.name}`, message: `تم إعادة ${personnel.name} من منصة ${platformName}`, read: false, createdAt: new Date() };
      adminIds.forEach(adminId => sendRealtimeNotification(io, adminId, notification));
      if (platformCommander) sendRealtimeNotification(io, platformCommander._id, notification);
    }

    res.json({ message: 'تمت الإعادة بنجاح' });
  } catch (error) {
    console.error('Error returning personnel:', error);
    res.status(500).json({ message: 'فشل الإعادة' });
  }
});

// POST /api/personnel/transfer - نقل كادر بين منصتين
router.post('/transfer', auth, async (req, res) => {
  const { type, id, fromPlatformId, toPlatformId } = req.body;
  const io = req.app.get('io');

  if (!type || !id || !fromPlatformId || !toPlatformId) {
    return res.status(400).json({ message: 'البيانات غير مكتملة' });
  }

  try {
    const Model = getModelByType(type);
    if (!Model) return res.status(400).json({ message: 'نوع الكادر غير صالح' });

    const personnel = await Model.findById(id);
    if (!personnel) return res.status(404).json({ message: 'الكادر غير موجود' });

    const toPlatform = await Platform.findOne({ id: toPlatformId });
    if (!toPlatform) return res.status(404).json({ message: 'المنصة الهدف غير موجودة' });

    const fromPlatformName = personnel.currentLocation;
    personnel.currentLocation = toPlatform.name;
    await personnel.save();

    // ✅ إرسال إشعارات
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
      adminIds.forEach(adminId => sendRealtimeNotification(io, adminId, notification));
      if (fromCommander) sendRealtimeNotification(io, fromCommander._id, notification);
      if (toCommander) sendRealtimeNotification(io, toCommander._id, notification);
    }

    res.json({ message: 'تم النقل بنجاح' });
  } catch (error) {
    console.error('Error transferring personnel:', error);
    res.status(500).json({ message: 'فشل النقل' });
  }
});

// PUT /api/personnel/rotation/:type/:id - تعديل تاريخ انتهاء المأمورية
router.put('/rotation/:type/:id', auth, async (req, res) => {
  const { type, id } = req.params;
  const { endDate } = req.body;

  if (!endDate) {
    return res.status(400).json({ message: 'تاريخ الانتهاء مطلوب' });
  }

  try {
    const Model = getModelByType(type);
    if (!Model) return res.status(400).json({ message: 'نوع الكادر غير صالح' });

    const personnel = await Model.findById(id);
    if (!personnel) return res.status(404).json({ message: 'الكادر غير موجود' });

    const oldEndDate = personnel.rotationEndDate;
    personnel.rotationEndDate = new Date(endDate);
    await personnel.save();

    // ✅ إشعار بتعديل تاريخ المأمورية (للكادر نفسه)
    await createNotification(
      personnel.userId || id,
      `📅 تعديل تاريخ نهاية المأمورية`,
      `تم تعديل تاريخ انتهاء مأموريتك من ${oldEndDate ? new Date(oldEndDate).toLocaleDateString() : 'غير محدد'} إلى ${new Date(endDate).toLocaleDateString()}`,
      'rotationAlert',
      { oldEndDate, newEndDate: endDate }
    );

    res.json({ message: 'تم تحديث تاريخ المأمورية' });
  } catch (error) {
    console.error('Error updating rotation date:', error);
    res.status(500).json({ message: 'فشل التحديث' });
  }
});

// GET /api/personnel/available-for-course - جلب الكوادر المتاحة للتسجيل في دورات
router.get('/available-for-course', auth, async (req, res) => {
  if (isMockMode()) {
    const officers = (global.mockDB?.officers || []).filter(p => p.currentLocation === 'headquarters' && p.attendanceStatus === 'present');
    const ncos = (global.mockDB?.ncos || []).filter(p => p.currentLocation === 'headquarters' && p.attendanceStatus === 'present');
    const recruits = (global.mockDB?.recruits || []).filter(p => p.currentLocation === 'headquarters' && p.attendanceStatus === 'present');
    return res.json([...officers, ...ncos, ...recruits]);
  }

  try {
    const officers = await Officer.find({ currentLocation: 'headquarters', attendanceStatus: 'present', currentCourseId: null });
    const ncos = await NCO.find({ currentLocation: 'headquarters', attendanceStatus: 'present', currentCourseId: null });
    const recruits = await Recruit.find({ currentLocation: 'headquarters', attendanceStatus: 'present', currentCourseId: null });
    res.json([...officers, ...ncos, ...recruits]);
  } catch (error) {
    console.error('Error fetching available personnel:', error);
    res.status(500).json({ message: 'فشل تحميل الكوادر المتاحة' });
  }
});

module.exports = router;