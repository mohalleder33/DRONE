const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Officer = require('../models/Officer');

const isMockMode = () => process.env.USE_MOCK_DB === 'true';

// GET all officers with pagination
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 10, search = '', attendanceStatus = '' } = req.query;

  if (isMockMode()) {
    let data = global.mockDB?.officers || [];
    if (search) data = data.filter(i => i.name.includes(search) || i.militaryId?.includes(search));
    if (attendanceStatus) data = data.filter(i => i.attendanceStatus === attendanceStatus);
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
        { militaryId: { $regex: search, $options: 'i' } }
      ];
    }
    if (attendanceStatus) query.attendanceStatus = attendanceStatus;

    const officers = await Officer.find(query)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Officer.countDocuments(query);

    res.json({
      data: officers,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching officers:', error);
    res.status(500).json({ message: 'خطأ في تحميل الضباط' });
  }
});

// ✅ GET single officer
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'معرف غير صالح' });
  }

  if (isMockMode()) {
    const data = global.mockDB?.officers || [];
    const item = data.find(i => i.id === id);
    if (!item) return res.status(404).json({ message: 'غير موجود' });
    return res.json(item);
  }

  try {
    const officer = await Officer.findById(id);
    if (!officer) return res.status(404).json({ message: 'الضابط غير موجود' });
    res.json(officer);
  } catch (error) {
    console.error('Error fetching officer:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// ✅ POST create new officer
router.post('/', auth, async (req, res) => {
  const { name, rank, militaryId, specialization, unit, attendanceStatus } = req.body;

  if (!name || !rank) {
    return res.status(400).json({ message: 'الاسم والرتبة مطلوبان' });
  }

  if (isMockMode()) {
    const newItem = { id: Date.now().toString(), ...req.body, type: 'officers' };
    if (!global.mockDB.officers) global.mockDB.officers = [];
    global.mockDB.officers.push(newItem);
    return res.status(201).json(newItem);
  }

  try {
    const newOfficer = new Officer({
      name,
      rank,
      militaryId: militaryId || '',
      specialization: specialization || '',
      unit: unit || '',
      attendanceStatus: attendanceStatus || 'present',
      currentLocation: 'headquarters',
      type: 'officers'
    });
    const saved = await newOfficer.save();
    console.log('✅ Officer saved to MongoDB:', saved._id);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error saving officer:', error);
    res.status(500).json({ message: 'فشل إضافة الضابط' });
  }
});

// ✅ PUT update officer
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'معرف غير صالح' });
  }

  if (isMockMode()) {
    const arr = global.mockDB?.officers || [];
    const index = arr.findIndex(i => i.id === id);
    if (index === -1) return res.status(404).json({ message: 'غير موجود' });
    arr[index] = { ...arr[index], ...req.body };
    return res.json(arr[index]);
  }

  try {
    const updated = await Officer.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'الضابط غير موجود' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating officer:', error);
    res.status(500).json({ message: 'خطأ في التحديث' });
  }
});

// ✅ DELETE officer
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'معرف غير صالح' });
  }

  if (isMockMode()) {
    let arr = global.mockDB?.officers || [];
    const newArr = arr.filter(i => i.id !== id);
    if (newArr.length === arr.length) return res.status(404).json({ message: 'غير موجود' });
    global.mockDB.officers = newArr;
    return res.json({ message: 'تم الحذف' });
  }

  try {
    const deleted = await Officer.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'الضابط غير موجود' });
    res.json({ message: 'تم الحذف' });
  } catch (error) {
    console.error('Error deleting officer:', error);
    res.status(500).json({ message: 'خطأ في الحذف' });
  }
});

module.exports = router;