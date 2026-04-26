const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Officer = require('../models/Officer');
const NCO = require('../models/NCO');
const Recruit = require('../models/Recruit');
const Equipment = require('../models/Equipment');
const Ammunition = require('../models/Ammunition');
const Platform = require('../models/Platform');

// ============== 1. إحصائيات الرئاسة (Stats) ==============
router.get('/stats', auth, async (req, res) => {
  try {
    const officers = await Officer.find({ currentLocation: 'headquarters' });
    const ncos = await NCO.find({ currentLocation: 'headquarters' });
    const recruits = await Recruit.find({ currentLocation: 'headquarters' });
    const all = [...officers, ...ncos, ...recruits];

    const total = all.length;
    const distribution = all.filter(p => 
      !['present', 'distributed', 'student'].includes(p.attendanceStatus)
    ).length;
    const present = all.filter(p => 
      ['present', 'distributed', 'student'].includes(p.attendanceStatus)
    ).length;

    res.json({ total, distribution, present });
  } catch (error) {
    console.error('Error in /headquarters/stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============== 2. كوادر الرئاسة (Personnel) ==============
router.get('/personnel', auth, async (req, res) => {
  const { page = 1, limit = 10, status = 'all', search = '' } = req.query;

  try {
    let query = { currentLocation: 'headquarters' };
    
    if (status !== 'all') {
      query.attendanceStatus = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { militaryId: { $regex: search, $options: 'i' } }
      ];
    }

    const officers = await Officer.find(query);
    const ncos = await NCO.find(query);
    const recruits = await Recruit.find(query);
    
    let all = [...officers, ...ncos, ...recruits];
    const total = all.length;
    
    all = all.map(p => ({
      ...p.toObject(),
      type: p.constructor.modelName.toLowerCase() === 'officer' ? 'officers' :
            p.constructor.modelName.toLowerCase() === 'nco' ? 'ncos' : 'recruits'
    }));

    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginated = all.slice(start, start + parseInt(limit));
    const pages = Math.ceil(total / parseInt(limit));

    res.json({
      data: paginated,
      pagination: {
        page: parseInt(page),
        pages,
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error in /headquarters/personnel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============== 3. معدات الرئاسة (Equipment) مع ترحيل ==============
router.get('/equipment', auth, async (req, res) => {
  const { search = '', page = 1, limit = 10 } = req.query;

  try {
    let query = { location: 'headquarters' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    const totalEquipment = await Equipment.countDocuments(query);
    const equipment = await Equipment.find(query)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    
    const groups = {};
    equipment.forEach(item => {
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
      groups[key].items.push({
        id: item._id,
        serialNumber: item.serialNumber,
        status: item.status,
        location: item.location
      });
    });

    res.json({
      data: Object.values(groups),
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(totalEquipment / parseInt(limit)),
        total: totalEquipment,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error in /headquarters/equipment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============== 4. ذخائر الرئاسة (Ammunition) مع ترحيل ==============
router.get('/ammunition', auth, async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;

  try {
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { caliber: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Ammunition.countDocuments(query);
    const ammunition = await Ammunition.find(query)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      data: ammunition.map(a => ({
        id: a._id,
        name: a.name,
        caliber: a.caliber,
        quantity: a.headquarters,
        minThreshold: a.minThreshold,
        distribution: a.distribution
      })),
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error in /headquarters/ammunition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============== 5. الورشة (Workshop) مع ترحيل ==============
router.get('/workshop', auth, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const query = { status: 'في الصيانة' };
    const total = await Equipment.countDocuments(query);
    const equipment = await Equipment.find(query)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    
    const groups = {};
    equipment.forEach(item => {
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
      groups[key].items.push({
        id: item._id,
        serialNumber: item.serialNumber,
        receivedDate: item.receivedDate,
        fromPlatform: item.fromPlatform,
        faultDescription: item.faultDescription
      });
    });

    res.json({
      data: Object.values(groups),
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error in /headquarters/workshop:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============== 6. معدات خارج الخدمة (Retired) مع ترحيل ==============
router.get('/retired', auth, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const query = { status: 'خارج الخدمة' };
    const total = await Equipment.countDocuments(query);
    const equipment = await Equipment.find(query)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    
    const groups = {};
    equipment.forEach(item => {
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
      groups[key].items.push({
        id: item._id,
        serialNumber: item.serialNumber,
        retireReason: item.retireReason
      });
    });

    res.json({
      data: Object.values(groups),
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error in /headquarters/retired:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============== 7. الذخائر الحرجة (Critical Ammunition) ==============
router.get('/critical/ammunition', auth, async (req, res) => {
  try {
    const ammunition = await Ammunition.find({
      $expr: { $lte: ["$headquarters", "$minThreshold"] }
    });
    
    res.json(ammunition.map(a => ({
      id: a._id,
      name: a.name,
      quantity: a.headquarters,
      minThreshold: a.minThreshold
    })));
  } catch (error) {
    console.error('Error in /headquarters/critical/ammunition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============== 8. المعدات الحرجة (Critical Equipment) ==============
router.get('/critical/equipment', auth, async (req, res) => {
  try {
    const equipment = await Equipment.find();
    const groups = {};
    equipment.forEach(item => {
      const key = `${item.name}_${item.model}`;
      if (!groups[key]) {
        groups[key] = {
          name: item.name,
          model: item.model,
          count: 0,
          threshold: 5
        };
      }
      groups[key].count++;
    });

    const critical = Object.values(groups).filter(g => g.count <= g.threshold);
    res.json(critical);
  } catch (error) {
    console.error('Error in /headquarters/critical/equipment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============== 9. تعيين كادر من الرئاسة ==============
router.post('/assign', auth, async (req, res) => {
  const { type, id, platformId, startDate, endDate } = req.body;

  try {
    let Model;
    if (type === 'officers') Model = Officer;
    else if (type === 'ncos') Model = NCO;
    else Model = Recruit;

    const personnel = await Model.findById(id);
    if (!personnel) {
      return res.status(404).json({ message: 'الكادر غير موجود' });
    }

    if (personnel.attendanceStatus !== 'present') {
      return res.status(400).json({ message: 'الكادر غير حاضر' });
    }

    const platform = await Platform.findOne({ id: platformId });
    if (!platform) {
      return res.status(404).json({ message: 'المنصة غير موجودة' });
    }

    personnel.currentLocation = platform.name;
    personnel.rotationEndDate = new Date(endDate);
    await personnel.save();

    res.json({ message: 'تم تعيين الكادر بنجاح' });
  } catch (error) {
    console.error('Error in /headquarters/assign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============== 10. تحديث حالة الكادر ==============
router.put('/personnel/:type/:id/status', auth, async (req, res) => {
  const { type, id } = req.params;
  const { attendanceStatus } = req.body;

  try {
    let Model;
    if (type === 'officers') Model = Officer;
    else if (type === 'ncos') Model = NCO;
    else Model = Recruit;

    const personnel = await Model.findById(id);
    if (!personnel) {
      return res.status(404).json({ message: 'الكادر غير موجود' });
    }

    personnel.attendanceStatus = attendanceStatus;
    await personnel.save();

    res.json({ message: 'تم تحديث الحالة بنجاح' });
  } catch (error) {
    console.error('Error updating personnel status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;