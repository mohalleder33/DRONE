const cron = require('node-cron');
const mongoose = require('mongoose');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Officer = require('../models/Officer');
const NCO = require('../models/NCO');
const Recruit = require('../models/Recruit');
const Equipment = require('../models/Equipment');
const Ammunition = require('../models/Ammunition');
const Platform = require('../models/Platform');
const TrainingCourse = require('../models/TrainingCourse');
const { createBulkNotifications, sendRealtimeNotification } = require('./notificationService');

// Helper function to get admin users
const getAdminUsers = async () => {
  return await User.find({ role: 'admin' }).select('_id');
};

// Helper function to get platform commanders
const getPlatformCommanders = async (platformId) => {
  return await User.find({ role: 'platformCommander', assignedPlatformId: platformId }).select('_id');
};

// ============== التنبيهات التي تعمل كل ساعة ==============

// 1. فحص مخزون الذخائر المنخفض
const checkLowAmmunition = async (io) => {
  console.log('🔍 Checking low ammunition...');
  const ammunition = await Ammunition.find({
    $expr: { $lte: ["$total", "$minThreshold"] }
  });
  
  if (ammunition.length === 0) return;
  
  const adminUsers = await getAdminUsers();
  const adminIds = adminUsers.map(u => u._id);
  
  for (const ammo of ammunition) {
    // إشعار للمسؤولين
    await createBulkNotifications(
      adminIds,
      `⚠️ مخزون منخفض: ${ammo.name}`,
      `الكمية الحالية: ${ammo.total} / الحد الأدنى: ${ammo.minThreshold}`,
      'lowStock',
      { ammunitionId: ammo._id, quantity: ammo.total, threshold: ammo.minThreshold }
    );
    
    // إشعار لقادة المنصات التي لديها هذا الصنف
    if (ammo.distribution?.platforms) {
      for (const [platformId, quantity] of Object.entries(ammo.distribution.platforms)) {
        const commanders = await getPlatformCommanders(platformId);
        if (commanders.length > 0) {
          await createBulkNotifications(
            commanders.map(c => c._id),
            `⚠️ مخزون منخفض في منصتك: ${ammo.name}`,
            `الكمية في المنصة: ${quantity} / الحد الأدنى: ${ammo.minThreshold}`,
            'lowStock',
            { ammunitionId: ammo._id, platformId, quantity }
          );
        }
      }
    }
  }
};

// 2. فحص نهاية المأمورية الوشيكة
const checkUpcomingRotations = async (io) => {
  console.log('🔍 Checking upcoming rotations...');
  const today = new Date();
  const threshold = 7; // الأيام القادمة
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + threshold);
  
  const officers = await Officer.find({
    rotationEndDate: { $gte: today, $lte: futureDate },
    currentLocation: { $ne: 'headquarters' }
  });
  const ncos = await NCO.find({
    rotationEndDate: { $gte: today, $lte: futureDate },
    currentLocation: { $ne: 'headquarters' }
  });
  const recruits = await Recruit.find({
    rotationEndDate: { $gte: today, $lte: futureDate },
    currentLocation: { $ne: 'headquarters' }
  });
  
  const allRotations = [...officers, ...ncos, ...recruits];
  
  for (const personnel of allRotations) {
    const remainingDays = Math.ceil((personnel.rotationEndDate - today) / (1000 * 60 * 60 * 24));
    
    // إشعار للكادر نفسه
    // Note: This requires linking personnel to user accounts - simplified version
    await createNotification(
      personnel.userId || personnel._id,
      `⏰ نهاية مأمورية وشيكة`,
      `تنتهي مأموريتك بعد ${remainingDays} يومًا في ${personnel.currentLocation}`,
      'rotationAlert',
      { remainingDays, platform: personnel.currentLocation, endDate: personnel.rotationEndDate }
    );
    
    // إشعار لقائد المنصة
    const platformCommanders = await getPlatformCommanders(personnel.currentLocation);
    if (platformCommanders.length > 0) {
      await createBulkNotifications(
        platformCommanders.map(c => c._id),
        `⏰ نهاية مأمورية وشيكة: ${personnel.name}`,
        `ينتهي ${personnel.name} (${personnel.rank}) مأموريته بعد ${remainingDays} يومًا`,
        'rotationAlert',
        { personnelId: personnel._id, name: personnel.name, rank: personnel.rank, remainingDays }
      );
    }
  }
};

// 3. فحص المعدات المكثفة في الورشة
const checkWorkshopDuration = async (io) => {
  console.log('🔍 Checking workshop duration...');
  const today = new Date();
  const threshold = 14; // 14 يوم كحد أقصى
  const equipment = await Equipment.find({ status: 'في الصيانة' });
  
  const longStay = equipment.filter(e => {
    if (!e.receivedDate) return false;
    const days = Math.ceil((today - new Date(e.receivedDate)) / (1000 * 60 * 60 * 24));
    return days > threshold;
  });
  
  if (longStay.length === 0) return;
  
  const adminUsers = await getAdminUsers();
  const adminIds = adminUsers.map(u => u._id);
  
  for (const eq of longStay) {
    const days = Math.ceil((today - new Date(eq.receivedDate)) / (1000 * 60 * 60 * 24));
    await createBulkNotifications(
      adminIds,
      `🔧 مكث طويل في الورشة: ${eq.name}`,
      `المعدة ${eq.name} (${eq.serialNumber}) مكثت ${days} يومًا في الورشة`,
      'workshop',
      { equipmentId: eq._id, name: eq.name, serialNumber: eq.serialNumber, days }
    );
  }
};

// ============== التنبيهات التي تعمل يومياً (عند منتصف الليل) ==============

// 4. فحص الدورات المنتهية
const checkExpiredCourses = async (io) => {
  console.log('🔍 Checking expired courses...');
  const today = new Date();
  const expiredCourses = await TrainingCourse.find({
    endDate: { $lt: today },
    status: { $ne: 'منتهية' }
  });
  
  for (const course of expiredCourses) {
    const adminUsers = await getAdminUsers();
    const adminIds = adminUsers.map(u => u._id);
    
    await createBulkNotifications(
      adminIds,
      `📚 دورة منتهية: ${course.courseName}`,
      `الدورة ${course.courseName} انتهت في ${new Date(course.endDate).toLocaleDateString()} ولم يتم تحديث حالتها`,
      'system',
      { courseId: course._id, courseName: course.courseName, endDate: course.endDate }
    );
  }
};

// 5. فحص الدورات الوشيكة البدء
const checkUpcomingCourses = async (io) => {
  console.log('🔍 Checking upcoming courses...');
  const today = new Date();
  const soonDate = new Date();
  soonDate.setDate(today.getDate() + 3);
  
  const upcomingCourses = await TrainingCourse.find({
    startDate: { $gte: today, $lte: soonDate },
    status: 'قادمة'
  });
  
  for (const course of upcomingCourses) {
    // إشعار للمشرفين
    const supervisors = await User.find({ role: 'trainingSupervisor' }).select('_id');
    if (supervisors.length > 0) {
      await createBulkNotifications(
        supervisors.map(s => s._id),
        `📚 دورة وشيكة البدء: ${course.courseName}`,
        `ستبدأ الدورة ${course.courseName} في ${new Date(course.startDate).toLocaleDateString()}`,
        'courseEnrollment',
        { courseId: course._id, courseName: course.courseName, startDate: course.startDate }
      );
    }
    
    // إشعار للدارسين
    const traineeIds = course.trainees.map(t => t.userId).filter(id => id);
    if (traineeIds.length > 0) {
      await createBulkNotifications(
        traineeIds,
        `📚 دورة وشيكة البدء: ${course.courseName}`,
        `ستبدأ الدورة ${course.courseName} التي أنت مسجل فيها في ${new Date(course.startDate).toLocaleDateString()}`,
        'courseEnrollment',
        { courseId: course._id, courseName: course.courseName, startDate: course.startDate }
      );
    }
  }
};

// 6. فحص المنصات المعطلة لفترة طويلة
const checkDisabledPlatforms = async (io) => {
  console.log('🔍 Checking disabled platforms...');
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const disabledPlatforms = await Platform.find({
    status: 'inactive',
    updatedAt: { $lt: thirtyDaysAgo }
  });
  
  if (disabledPlatforms.length === 0) return;
  
  const adminUsers = await getAdminUsers();
  const adminIds = adminUsers.map(u => u._id);
  
  for (const platform of disabledPlatforms) {
    await createBulkNotifications(
      adminIds,
      `🏢 منصة معطلة لفترة طويلة: ${platform.name}`,
      `المنصة ${platform.name} معطلة منذ أكثر من 30 يومًا`,
      'platformAlert',
      { platformId: platform.id, platformName: platform.name, disabledAt: platform.updatedAt }
    );
  }
};

// 7. فحص تجاوز سعة المنصة
const checkPlatformCapacity = async (io) => {
  console.log('🔍 Checking platform capacity...');
  const platforms = await Platform.find({ maxPersonnel: { $ne: null, $gt: 0 } });
  
  for (const platform of platforms) {
    const officers = await Officer.countDocuments({ currentLocation: platform.name });
    const ncos = await NCO.countDocuments({ currentLocation: platform.name });
    const recruits = await Recruit.countDocuments({ currentLocation: platform.name });
    const totalPersonnel = officers + ncos + recruits;
    
    if (totalPersonnel > platform.maxPersonnel) {
      const commander = await User.findOne({ role: 'platformCommander', assignedPlatformId: platform.id });
      if (commander) {
        await createNotification(
          commander._id,
          `⚠️ تجاوز سعة المنصة: ${platform.name}`,
          `عدد الكوادر: ${totalPersonnel} / الحد الأقصى: ${platform.maxPersonnel}`,
          'platformAlert',
          { platformId: platform.id, platformName: platform.name, current: totalPersonnel, max: platform.maxPersonnel }
        );
      }
    }
  }
};

// تهيئة جميع المهام المجدولة
const initAlertScheduler = (io) => {
  console.log('⏰ Initializing alert scheduler...');
  
  // كل ساعة (0 دقيقة من كل ساعة)
  cron.schedule('0 * * * *', async () => {
    console.log('🕐 Running hourly alerts...');
    await checkLowAmmunition(io);
    await checkUpcomingRotations(io);
    await checkWorkshopDuration(io);
    await checkPlatformCapacity(io);
  });
  
  // كل يوم عند منتصف الليل (0:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('🌙 Running daily alerts...');
    await checkExpiredCourses(io);
    await checkUpcomingCourses(io);
    await checkDisabledPlatforms(io);
  });
  
  console.log('✅ Alert scheduler initialized successfully');
};

module.exports = { initAlertScheduler };