const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Officer = require('../models/Officer');
const NCO = require('../models/NCO');
const Recruit = require('../models/Recruit');
const Equipment = require('../models/Equipment');
const Ammunition = require('../models/Ammunition');
const Platform = require('../models/Platform');
const TrainingCourse = require('../models/TrainingCourse');
const Log = require('../models/Log');


const isMockMode = () => process.env.USE_MOCK_DB === 'true';

// ============== التقارير العامة ==============
// GET /api/reports/general-daily-stats
router.get('/general-daily-stats', auth, async (req, res) => {
  if (isMockMode()) {
    return res.json({
      headquarters: { power: 50, distribution: 10, present: 40 },
      platforms: [
        { id: '1', name: 'منصة الشمال', power: 30, distribution: 5, present: 25 },
        { id: '2', name: 'منصة الجنوب', power: 20, distribution: 3, present: 17 }
      ],
      courses: { power: 15, distribution: 2, present: 13 },
      totals: { power: 115, distribution: 20, present: 95 }
    });
  }

  try {
    // إحصائيات الرئاسة
    const headquartersOfficers = await Officer.countDocuments({ currentLocation: 'headquarters' });
    const headquartersNCOs = await NCO.countDocuments({ currentLocation: 'headquarters' });
    const headquartersRecruits = await Recruit.countDocuments({ currentLocation: 'headquarters' });
    const headquartersPower = headquartersOfficers + headquartersNCOs + headquartersRecruits;
    
    const headquartersDistribution = await Officer.countDocuments({ currentLocation: 'headquarters', attendanceStatus: { $nin: ['present', 'distributed', 'student'] } })
      + await NCO.countDocuments({ currentLocation: 'headquarters', attendanceStatus: { $nin: ['present', 'distributed', 'student'] } })
      + await Recruit.countDocuments({ currentLocation: 'headquarters', attendanceStatus: { $nin: ['present', 'distributed', 'student'] } });
    
    const headquartersPresent = await Officer.countDocuments({ currentLocation: 'headquarters', attendanceStatus: { $in: ['present', 'distributed', 'student'] } })
      + await NCO.countDocuments({ currentLocation: 'headquarters', attendanceStatus: { $in: ['present', 'distributed', 'student'] } })
      + await Recruit.countDocuments({ currentLocation: 'headquarters', attendanceStatus: { $in: ['present', 'distributed', 'student'] } });

    // إحصائيات المنصات
    const platforms = await Platform.find();
    const platformsStats = await Promise.all(platforms.map(async (p) => {
      const officers = await Officer.countDocuments({ currentLocation: p.name });
      const ncos = await NCO.countDocuments({ currentLocation: p.name });
      const recruits = await Recruit.countDocuments({ currentLocation: p.name });
      const power = officers + ncos + recruits;
      const distribution = await Officer.countDocuments({ currentLocation: p.name, attendanceStatus: { $nin: ['present', 'distributed', 'student'] } })
        + await NCO.countDocuments({ currentLocation: p.name, attendanceStatus: { $nin: ['present', 'distributed', 'student'] } })
        + await Recruit.countDocuments({ currentLocation: p.name, attendanceStatus: { $nin: ['present', 'distributed', 'student'] } });
      const present = await Officer.countDocuments({ currentLocation: p.name, attendanceStatus: { $in: ['present', 'distributed', 'student'] } })
        + await NCO.countDocuments({ currentLocation: p.name, attendanceStatus: { $in: ['present', 'distributed', 'student'] } })
        + await Recruit.countDocuments({ currentLocation: p.name, attendanceStatus: { $in: ['present', 'distributed', 'student'] } });
      return { id: p.id, name: p.name, power, distribution, present };
    }));

    // إحصائيات الدورات
    const courses = await TrainingCourse.find();
    let coursesPower = 0, coursesDistribution = 0, coursesPresent = 0;
    for (const course of courses) {
      coursesPower += course.trainees.length;
      coursesDistribution += course.trainees.filter(t => t.attendance !== 'حاضر').length;
      coursesPresent += course.trainees.filter(t => t.attendance === 'حاضر').length;
    }

    const totals = {
      power: headquartersPower + platformsStats.reduce((a, b) => a + b.power, 0) + coursesPower,
      distribution: headquartersDistribution + platformsStats.reduce((a, b) => a + b.distribution, 0) + coursesDistribution,
      present: headquartersPresent + platformsStats.reduce((a, b) => a + b.present, 0) + coursesPresent
    };

    res.json({
      headquarters: { power: headquartersPower, distribution: headquartersDistribution, present: headquartersPresent },
      platforms: platformsStats,
      courses: { power: coursesPower, distribution: coursesDistribution, present: coursesPresent },
      totals
    });
  } catch (error) {
    console.error('Error in general-daily-stats:', error);
    res.status(500).json({ message: 'خطأ في جلب الإحصائيات' });
  }
});

// GET /api/reports/personnel-list
router.get('/personnel-list', auth, async (req, res) => {
  const { location, platformId, courseId } = req.query;

  if (isMockMode()) {
    let personnel = [];
    if (location === 'general') {
      personnel = [...(global.mockDB?.officers || []), ...(global.mockDB?.ncos || []), ...(global.mockDB?.recruits || [])];
    } else if (location === 'headquarters') {
      personnel = [
        ...(global.mockDB?.officers?.filter(p => p.currentLocation === 'headquarters') || []),
        ...(global.mockDB?.ncos?.filter(p => p.currentLocation === 'headquarters') || []),
        ...(global.mockDB?.recruits?.filter(p => p.currentLocation === 'headquarters') || [])
      ];
    } else if (location === 'platform' && platformId) {
      const platform = global.mockDB?.platforms?.find(p => p.id === platformId);
      if (platform) {
        personnel = [
          ...(global.mockDB?.officers?.filter(p => p.currentLocation === platform.name) || []),
          ...(global.mockDB?.ncos?.filter(p => p.currentLocation === platform.name) || []),
          ...(global.mockDB?.recruits?.filter(p => p.currentLocation === platform.name) || [])
        ];
      }
    } else if (location === 'courses' && courseId) {
      const course = global.mockDB?.courses?.find(c => c.id === courseId);
      if (course && course.trainees) {
        personnel = course.trainees;
      }
    }
    return res.json(personnel);
  }

  try {
    let personnel = [];
    if (location === 'general') {
      const officers = await Officer.find();
      const ncos = await NCO.find();
      const recruits = await Recruit.find();
      personnel = [...officers, ...ncos, ...recruits];
    } else if (location === 'headquarters') {
      const officers = await Officer.find({ currentLocation: 'headquarters' });
      const ncos = await NCO.find({ currentLocation: 'headquarters' });
      const recruits = await Recruit.find({ currentLocation: 'headquarters' });
      personnel = [...officers, ...ncos, ...recruits];
    } else if (location === 'platform' && platformId) {
      const platform = await Platform.findOne({ id: platformId });
      if (platform) {
        const officers = await Officer.find({ currentLocation: platform.name });
        const ncos = await NCO.find({ currentLocation: platform.name });
        const recruits = await Recruit.find({ currentLocation: platform.name });
        personnel = [...officers, ...ncos, ...recruits];
      }
    } else if (location === 'courses' && courseId) {
      const course = await TrainingCourse.findById(courseId);
      if (course && course.trainees) {
        personnel = course.trainees;
      }
    }
    res.json(personnel);
  } catch (error) {
    console.error('Error in personnel-list:', error);
    res.status(500).json({ message: 'خطأ في جلب قائمة الكوادر' });
  }
});

// ============== تقارير الرئاسة ==============
// ============== تقرير الرئاسة ==============
router.get('/headquarters', auth, async (req, res) => {
  // منع التخزين المؤقت
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (isMockMode()) {
    return res.json({
      personnelStats: { power: 50, distribution: 10, present: 40 },
      equipment: { total: 100, inWarehouse: 80, inWorkshop: 15, retired: 5 },
      ammunition: { total: 5000, byType: [
        { id: '1', name: 'ذخيرة عيار 7.62', quantity: 3000, minThreshold: 500 },
        { id: '2', name: 'ذخيرة عيار 9mm', quantity: 2000, minThreshold: 1000 }
      ]}
    });
  }

  try {
    // ----- إحصائيات الكوادر في الرئاسة -----
    const officers = await Officer.find({ currentLocation: 'headquarters' });
    const ncos = await NCO.find({ currentLocation: 'headquarters' });
    const recruits = await Recruit.find({ currentLocation: 'headquarters' });
    const allPersonnel = [...officers, ...ncos, ...recruits];
    
    const power = allPersonnel.length;
    const distribution = allPersonnel.filter(p => 
      !['present', 'distributed', 'student'].includes(p.attendanceStatus)
    ).length;
    const present = allPersonnel.filter(p => 
      ['present', 'distributed', 'student'].includes(p.attendanceStatus)
    ).length;

    // ----- إحصائيات المعدات في الرئاسة -----
    const equipmentList = await Equipment.find({ location: 'headquarters' });
    const totalEquipment = equipmentList.length;
    const inWarehouse = equipmentList.filter(e => e.status !== 'في الصيانة' && e.status !== 'خارج الخدمة').length;
    const inWorkshop = equipmentList.filter(e => e.status === 'في الصيانة').length;
    const retired = equipmentList.filter(e => e.status === 'خارج الخدمة').length;

    // ----- إحصائيات الذخائر في الرئاسة -----
    const ammunitionList = await Ammunition.find();
    const byType = ammunitionList.map(a => ({
      id: a._id,
      name: a.name,
      quantity: a.headquarters,
      minThreshold: a.minThreshold
    }));
    const totalAmmunition = byType.reduce((sum, a) => sum + a.quantity, 0);

    res.json({
      personnelStats: { power, distribution, present },
      equipment: { total: totalEquipment, inWarehouse, inWorkshop, retired },
      ammunition: { total: totalAmmunition, byType }
    });
  } catch (error) {
    console.error('Error in /reports/headquarters:', error);
    res.status(500).json({ message: 'خطأ في تحميل تقرير الرئاسة' });
  }
});

// ============== تقارير المنصات ==============
router.get('/platform/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (isMockMode()) {
    const platform = global.mockDB?.platforms?.find(p => p.id === id);
    if (!platform) return res.status(404).json({ message: 'Platform not found' });
    return res.json({
      platformName: platform.name,
      location: platform.location,
      status: platform.status,
      personnelStats: platform.personnelStats || { power: 0, distribution: 0, present: 0 }
    });
  }

  try {
    const platform = await Platform.findOne({ id });
    if (!platform) return res.status(404).json({ message: 'المنصة غير موجودة' });

    const officers = await Officer.find({ currentLocation: platform.name });
    const ncos = await NCO.find({ currentLocation: platform.name });
    const recruits = await Recruit.find({ currentLocation: platform.name });
    const power = officers.length + ncos.length + recruits.length;
    const distribution = officers.filter(o => !['present', 'distributed', 'student'].includes(o.attendanceStatus)).length
      + ncos.filter(n => !['present', 'distributed', 'student'].includes(n.attendanceStatus)).length
      + recruits.filter(r => !['present', 'distributed', 'student'].includes(r.attendanceStatus)).length;
    const present = officers.filter(o => ['present', 'distributed', 'student'].includes(o.attendanceStatus)).length
      + ncos.filter(n => ['present', 'distributed', 'student'].includes(n.attendanceStatus)).length
      + recruits.filter(r => ['present', 'distributed', 'student'].includes(r.attendanceStatus)).length;

    res.json({
      platformName: platform.name,
      location: platform.location,
      status: platform.status,
      personnelStats: { power, distribution, present }
    });
  } catch (error) {
    console.error('Error in platform report:', error);
    res.status(500).json({ message: 'خطأ في جلب تقرير المنصة' });
  }
});

router.get('/platform/:id/equipment', auth, async (req, res) => {
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
    console.error('Error in platform equipment:', error);
    res.status(500).json({ message: 'خطأ في جلب معدات المنصة' });
  }
});

router.get('/platform/:id/ammunition', auth, async (req, res) => {
  const { id } = req.params;

  if (isMockMode()) {
    const platform = global.mockDB?.platforms?.find(p => p.id === id);
    if (!platform) return res.status(404).json({ message: 'Platform not found' });
    const ammunition = (global.mockDB?.ammunition || []).map(a => ({
      id: a.id,
      name: a.name,
      caliber: a.caliber,
      quantity: a.distribution?.platforms?.[platform.name] || 0,
      minThreshold: a.minThreshold
    }));
    return res.json(ammunition);
  }

  try {
    const platform = await Platform.findOne({ id });
    if (!platform) return res.status(404).json({ message: 'المنصة غير موجودة' });
    const allAmmunition = await Ammunition.find();
    const ammunition = allAmmunition.map(a => ({
      id: a._id,
      name: a.name,
      caliber: a.caliber,
      quantity: a.distribution?.platforms?.get(platform.name) || 0,
      minThreshold: a.minThreshold
    }));
    res.json(ammunition);
  } catch (error) {
    console.error('Error in platform ammunition:', error);
    res.status(500).json({ message: 'خطأ في جلب ذخائر المنصة' });
  }
});

// ============== تقارير المعدات والذخائر العامة ==============
router.get('/equipment/global', auth, async (req, res) => {
  if (isMockMode()) {
    return res.json({
      headquarters: { total: 80, criticalThreshold: 10, retired: 5 },
      platforms: [
        { id: '1', name: 'منصة الشمال', total: 30, criticalThreshold: 5, retired: 2 },
        { id: '2', name: 'منصة الجنوب', total: 20, criticalThreshold: 5, retired: 1 }
      ],
      workshop: { total: 15, criticalThreshold: 7 },
      retired: { total: 8 },
      globalTotal: 145
    });
  }

  try {
    const allEquipment = await Equipment.find();
    const headquartersEquipment = allEquipment.filter(e => e.location === 'headquarters' && e.status !== 'خارج الخدمة');
    const platforms = await Platform.find();
    const platformsStats = await Promise.all(platforms.map(async (p) => {
      const platformEquipment = allEquipment.filter(e => e.location === p.name && e.status !== 'خارج الخدمة');
      const retiredCount = allEquipment.filter(e => e.location === p.name && e.status === 'خارج الخدمة').length;
      return {
        id: p.id,
        name: p.name,
        total: platformEquipment.length,
        criticalThreshold: 5, // يمكن جلبها من الإعدادات
        retired: retiredCount
      };
    }));
    const workshopCount = allEquipment.filter(e => e.status === 'في الصيانة').length;
    const retiredCount = allEquipment.filter(e => e.status === 'خارج الخدمة').length;
    const globalTotal = allEquipment.length;

    res.json({
      headquarters: {
        total: headquartersEquipment.length,
        criticalThreshold: 10,
        retired: allEquipment.filter(e => e.location === 'headquarters' && e.status === 'خارج الخدمة').length
      },
      platforms: platformsStats,
      workshop: { total: workshopCount, criticalThreshold: 7 },
      retired: { total: retiredCount },
      globalTotal
    });
  } catch (error) {
    console.error('Error in equipment/global:', error);
    res.status(500).json({ message: 'خطأ في جلب تقرير المعدات العام' });
  }
});

router.get('/ammunition/global', auth, async (req, res) => {
  if (isMockMode()) {
    return {
      items: [
        { id: '1', name: 'ذخيرة عيار 7.62', caliber: '7.62x39', type: 'خارقة', total: 5000, headquarters: 3000, platforms: 2000, minThreshold: 500 },
        { id: '2', name: 'ذخيرة عيار 9mm', caliber: '9x19', type: 'خارقة', total: 8000, headquarters: 5000, platforms: 3000, minThreshold: 1000 }
      ],
      total: 13000,
      headquartersTotal: 8000,
      platformsTotal: 5000
    };
  }

  try {
    const ammunition = await Ammunition.find();
    const items = ammunition.map(a => ({
      id: a._id,
      name: a.name,
      caliber: a.caliber,
      type: a.type,
      total: a.total,
      headquarters: a.headquarters,
      platforms: a.platforms,
      minThreshold: a.minThreshold
    }));
    const total = ammunition.reduce((a, b) => a + b.total, 0);
    const headquartersTotal = ammunition.reduce((a, b) => a + b.headquarters, 0);
    const platformsTotal = ammunition.reduce((a, b) => a + b.platforms, 0);

    res.json({ items, total, headquartersTotal, platformsTotal });
  } catch (error) {
    console.error('Error in ammunition/global:', error);
    res.status(500).json({ message: 'خطأ في جلب تقرير الذخائر العام' });
  }
});

// ============== تقارير الدورات ==============
router.get('/course/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (isMockMode()) {
    const course = global.mockDB?.courses?.find(c => c.id === id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    return res.json(course);
  }

  try {
    const course = await TrainingCourse.findById(id);
    if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });
    res.json(course);
  } catch (error) {
    console.error('Error in course report:', error);
    res.status(500).json({ message: 'خطأ في جلب تقرير الدورة' });
  }
});

// ============== سجل العمليات ==============
router.get('/logs', auth, async (req, res) => {
  const { page = 1, limit = 50, action, entityType, search, startDate, endDate } = req.query;

  if (req.user.role !== 'admin' && req.user.role !== 'commander') {
    return res.status(403).json({ message: 'غير مصرح' });
  }

  if (isMockMode()) {
    let logs = global.mockDB?.logs || [];
    if (action) logs = logs.filter(l => l.action === action);
    if (entityType) logs = logs.filter(l => l.entityType === entityType);
    if (search) logs = logs.filter(l => JSON.stringify(l.details).includes(search));
    if (startDate) logs = logs.filter(l => new Date(l.createdAt) >= new Date(startDate));
    if (endDate) logs = logs.filter(l => new Date(l.createdAt) <= new Date(endDate));
    const start = (page - 1) * limit;
    const paginated = logs.slice(start, start + limit);
    return res.json({
      data: paginated,
      pagination: { page: parseInt(page), pages: Math.ceil(logs.length / limit), total: logs.length, limit: parseInt(limit) }
    });
  }

  try {
    const query = {};
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (search) query.details = { $regex: search, $options: 'i' };
    if (startDate) query.createdAt = { $gte: new Date(startDate) };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };

    const logs = await Log.find(query)
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    const total = await Log.countDocuments(query);

    res.json({
      data: logs,
      pagination: { page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total, limit: parseInt(limit) }
    });
  } catch (error) {
    console.error('Error in logs report:', error);
    res.status(500).json({ message: 'خطأ في جلب سجل العمليات' });
  }
});
// ✅ تقرير المعدات (مع فلترة حسب الموقع)
router.get('/equipment', auth, async (req, res) => {
  const { location } = req.query;
  
  try {
    let query = {};
    if (location === 'headquarters') {
      query.location = 'headquarters';
    }
    
    const equipment = await Equipment.find(query);
    const total = equipment.length;
    const inWarehouse = equipment.filter(e => e.status !== 'في الصيانة' && e.status !== 'خارج الخدمة').length;
    const inWorkshop = equipment.filter(e => e.status === 'في الصيانة').length;
    const retired = equipment.filter(e => e.status === 'خارج الخدمة').length;
    
    res.json({
      equipment: { total, inWarehouse, inWorkshop, retired }
    });
  } catch (error) {
    console.error('Error in /reports/equipment:', error);
    res.status(500).json({ message: 'خطأ في تحميل بيانات المعدات' });
  }
});

// ✅ تقرير الذخائر (مع فلترة حسب الموقع)
router.get('/ammunition', auth, async (req, res) => {
  const { location } = req.query;
  
  try {
    const ammunition = await Ammunition.find();
    
    if (location === 'headquarters') {
      const byType = ammunition.map(a => ({
        id: a._id,
        name: a.name,
        quantity: a.headquarters,
        minThreshold: a.minThreshold
      }));
      const total = byType.reduce((s, a) => s + a.quantity, 0);
      res.json({
        ammunition: { total, byType }
      });
    } else {
      res.json({ ammunition: { total: 0, byType: [] } });
    }
  } catch (error) {
    console.error('Error in /reports/ammunition:', error);
    res.status(500).json({ message: 'خطأ في تحميل بيانات الذخائر' });
  }
});

module.exports = router;