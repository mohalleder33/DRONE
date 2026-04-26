const express = require('express');
const router = express.Router();
const Officer = require('../models/Officer');
const NCO = require('../models/NCO');
const Recruit = require('../models/Recruit');
const Equipment = require('../models/Equipment');
const Ammunition = require('../models/Ammunition');
const Platform = require('../models/Platform');
const TrainingCourse = require('../models/TrainingCourse');

// ============== 1. إحصائيات الكوادر (Personnel) ==============
router.get('/personnel', async (req, res) => {
  try {
    // ----- الرئاسة (Headquarters) -----
    const headquartersOfficers = await Officer.find({ currentLocation: 'headquarters' });
    const headquartersNCOs = await NCO.find({ currentLocation: 'headquarters' });
    const headquartersRecruits = await Recruit.find({ currentLocation: 'headquarters' });
    const headquartersAll = [...headquartersOfficers, ...headquartersNCOs, ...headquartersRecruits];
    
    const headquartersPower = headquartersAll.length;
    const headquartersDistribution = headquartersAll.filter(p => 
      !['present', 'distributed', 'student'].includes(p.attendanceStatus)
    ).length;
    const headquartersPresent = headquartersAll.filter(p => 
      ['present', 'distributed', 'student'].includes(p.attendanceStatus)
    ).length;

    // ----- المنصات (Platforms) -----
    const platforms = await Platform.find();
    const platformsStats = await Promise.all(platforms.map(async (platform) => {
      const officers = await Officer.find({ currentLocation: platform.name });
      const ncos = await NCO.find({ currentLocation: platform.name });
      const recruits = await Recruit.find({ currentLocation: platform.name });
      const all = [...officers, ...ncos, ...recruits];
      
      return {
        id: platform.id,
        name: platform.name,
        power: all.length,
        distribution: all.filter(p => !['present', 'distributed', 'student'].includes(p.attendanceStatus)).length,
        present: all.filter(p => ['present', 'distributed', 'student'].includes(p.attendanceStatus)).length
      };
    }));

// ============== إحصائيات الدورات التدريبية ==============
const courses = await TrainingCourse.find();
let coursesPower = 0, coursesDistribution = 0, coursesPresent = 0;

for (const course of courses) {
  const trainees = course.trainees || [];
  coursesPower += trainees.length;
  coursesDistribution += trainees.filter(t => t.attendance !== 'حاضر').length;
  coursesPresent += trainees.filter(t => t.attendance === 'حاضر').length;
}

    // ----- الإجمالي العام -----
    const allOfficers = await Officer.find();
    const allNCOs = await NCO.find();
    const allRecruits = await Recruit.find();
    const allPersonnel = [...allOfficers, ...allNCOs, ...allRecruits];
    
    const totalPower = allPersonnel.length + coursesPower;
    const totalDistribution = allPersonnel.filter(p => 
      !['present', 'distributed', 'student'].includes(p.attendanceStatus)
    ).length + coursesDistribution;
    const totalPresent = allPersonnel.filter(p => 
      ['present', 'distributed', 'student'].includes(p.attendanceStatus)
    ).length + coursesPresent;

    res.json({
      general: {
        power: totalPower,
        distribution: totalDistribution,
        present: totalPresent
      },
      headquarters: {
        power: headquartersPower,
        distribution: headquartersDistribution,
        present: headquartersPresent
      },
      platforms: platformsStats,
      courses: {
        power: coursesPower,
        distribution: coursesDistribution,
        present: coursesPresent
      }
    });
  } catch (error) {
    console.error('Error in /dashboard/personnel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============== 2. إحصائيات المعدات (Equipment) ==============
router.get('/equipment', async (req, res) => {
  try {
    const allEquipment = await Equipment.find();
    
    const total = allEquipment.length;
    const inHeadquarters = allEquipment.filter(e => e.location === 'headquarters' && e.status !== 'خارج الخدمة').length;
    const inPlatforms = allEquipment.filter(e => e.location !== 'headquarters' && e.location !== 'workshop' && e.location !== 'retired' && e.status !== 'خارج الخدمة').length;
    const inWorkshop = allEquipment.filter(e => e.status === 'في الصيانة').length;
    const retired = allEquipment.filter(e => e.status === 'خارج الخدمة').length;

    res.json({ total, inHeadquarters, inPlatforms, inWorkshop, retired });
  } catch (error) {
    console.error('Error in /dashboard/equipment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============== 3. الذخائر (Ammunition) ==============
router.get('/ammunition', async (req, res) => {
  try {
    const ammunition = await Ammunition.find();
    const result = ammunition.map(a => ({
      id: a._id,
      name: a.name,
      caliber: a.caliber,
      total: a.total,
      headquarters: a.headquarters,
      platforms: a.platforms,
      minThreshold: a.minThreshold
    }));
    res.json(result);
  } catch (error) {
    console.error('Error in /dashboard/ammunition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============== 4. الاستحقاقات الوشيكة (Upcoming Rotations) ==============
router.get('/upcoming-rotations', async (req, res) => {
  try {
    const today = new Date();
    const threshold = 30; // الأيام القادمة (يمكن جلبها من الإعدادات لاحقاً)
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
    const result = allRotations.map(p => {
      const remainingDays = Math.ceil((new Date(p.rotationEndDate) - today) / (1000 * 60 * 60 * 24));
      return {
        militaryId: p.militaryId,
        rank: p.rank,
        name: p.name,
        platform: p.currentLocation,
        endDate: p.rotationEndDate,
        remainingDays
      };
    }).sort((a, b) => a.remainingDays - b.remainingDays);

    res.json(result);
  } catch (error) {
    console.error('Error in /dashboard/upcoming-rotations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;