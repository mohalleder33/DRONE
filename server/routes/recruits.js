const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Recruit = require('../models/Recruit');

const isMockMode = () => process.env.USE_MOCK_DB === 'true';

// GET all recruits with pagination
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 10, search = '', attendanceStatus = '' } = req.query;

  if (isMockMode()) {
    let data = global.mockDB?.recruits || [];
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

    const recruits = await Recruit.find(query)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Recruit.countDocuments(query);

    res.json({
      data: recruits,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching recruits:', error);
    res.status(500).json({ message: 'خطأ في تحميل المستنفرين' });
  }
});

// ✅ GET single recruit
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'معرف غير صالح' });
  }

  if (isMockMode()) {
    const data = global.mockDB?.recruits || [];
    const item = data.find(i => i.id === id);
    if (!item) return res.status(404).json({ message: 'غير موجود' });
    return res.json(item);
  }

  try {
    const recruit = await Recruit.findById(id);
    if (!recruit) return res.status(404).json({ message: 'المستنفر غير موجود' });
    res.json(recruit);
  } catch (error) {
    console.error('Error fetching recruit:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// ✅ POST create new recruit
router.post('/', auth, async (req, res) => {
  const { name, rank, militaryId, specialization, unit, attendanceStatus } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'الاسم مطلوب' });
  }

  if (isMockMode()) {
    const newItem = { id: Date.now().toString(), ...req.body, type: 'recruits' };
    if (!global.mockDB.recruits) global.mockDB.recruits = [];
    global.mockDB.recruits.push(newItem);
    return res.status(201).json(newItem);
  }

  try {
    const newRecruit = new Recruit({
      name,
      rank: rank || 'مستنفر',
      militaryId: militaryId || '',
      specialization: specialization || '',
      unit: unit || '',
      attendanceStatus: attendanceStatus || 'present',
      currentLocation: 'headquarters',
      type: 'recruits'
    });
    const saved = await newRecruit.save();
    console.log('✅ Recruit saved to MongoDB:', saved._id);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error saving recruit:', error);
    res.status(500).json({ message: 'فشل إضافة المستنفر' });
  }
});

// ✅ PUT update recruit
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'معرف غير صالح' });
  }

  if (isMockMode()) {
    const arr = global.mockDB?.recruits || [];
    const index = arr.findIndex(i => i.id === id);
    if (index === -1) return res.status(404).json({ message: 'غير موجود' });
    arr[index] = { ...arr[index], ...req.body };
    return res.json(arr[index]);
  }

  try {
    const updated = await Recruit.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'المستنفر غير موجود' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating recruit:', error);
    res.status(500).json({ message: 'خطأ في التحديث' });
  }
});

// ✅ DELETE recruit
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'معرف غير صالح' });
  }

  if (isMockMode()) {
    let arr = global.mockDB?.recruits || [];
    const newArr = arr.filter(i => i.id !== id);
    if (newArr.length === arr.length) return res.status(404).json({ message: 'غير موجود' });
    global.mockDB.recruits = newArr;
    return res.json({ message: 'تم الحذف' });
  }

  try {
    const deleted = await Recruit.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'المستنفر غير موجود' });
    res.json({ message: 'تم الحذف' });
  } catch (error) {
    console.error('Error deleting recruit:', error);
    res.status(500).json({ message: 'خطأ في الحذف' });
  }
});

module.exports = router;