const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const NCO = require('../models/NCO');

const isMockMode = () => process.env.USE_MOCK_DB === 'true';

// GET all NCOs with pagination
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 10, search = '', attendanceStatus = '' } = req.query;

  if (isMockMode()) {
    let data = global.mockDB?.ncos || [];
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

    const ncos = await NCO.find(query)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await NCO.countDocuments(query);

    res.json({
      data: ncos,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching NCOs:', error);
    res.status(500).json({ message: 'خطأ في تحميل ضباط الصف' });
  }
});

// ✅ GET single NCO (مصحح)
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;

  // التحقق من صحة المعرف
  if (!id) {
    return res.status(400).json({ message: 'معرف غير صالح' });
  }

  if (isMockMode()) {
    const data = global.mockDB?.ncos || [];
    const item = data.find(i => i.id === id);
    if (!item) return res.status(404).json({ message: 'غير موجود' });
    return res.json(item);
  }

  try {
    const nco = await NCO.findById(id);
    if (!nco) return res.status(404).json({ message: 'ضابط الصف غير موجود' });
    res.json(nco);
  } catch (error) {
    console.error('Error fetching NCO:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// ✅ POST create new NCO
router.post('/', auth, async (req, res) => {
  const { name, rank, militaryId, specialization, unit, attendanceStatus } = req.body;

  if (!name || !rank) {
    return res.status(400).json({ message: 'الاسم والرتبة مطلوبان' });
  }

  if (isMockMode()) {
    const newItem = { id: Date.now().toString(), ...req.body, type: 'ncos' };
    if (!global.mockDB.ncos) global.mockDB.ncos = [];
    global.mockDB.ncos.push(newItem);
    return res.status(201).json(newItem);
  }

  try {
    const newNCO = new NCO({
      name,
      rank,
      militaryId: militaryId || '',
      specialization: specialization || '',
      unit: unit || '',
      attendanceStatus: attendanceStatus || 'present',
      currentLocation: 'headquarters',
      type: 'ncos'
    });
    const saved = await newNCO.save();
    console.log('✅ NCO saved to MongoDB:', saved._id);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error saving NCO:', error);
    res.status(500).json({ message: 'فشل إضافة ضابط الصف' });
  }
});

// ✅ PUT update NCO (مصحح)
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'معرف غير صالح' });
  }

  if (isMockMode()) {
    const arr = global.mockDB?.ncos || [];
    const index = arr.findIndex(i => i.id === id);
    if (index === -1) return res.status(404).json({ message: 'غير موجود' });
    arr[index] = { ...arr[index], ...req.body };
    return res.json(arr[index]);
  }

  try {
    const updated = await NCO.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'ضابط الصف غير موجود' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating NCO:', error);
    res.status(500).json({ message: 'خطأ في التحديث' });
  }
});

// ✅ DELETE NCO (مصحح)
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'معرف غير صالح' });
  }

  if (isMockMode()) {
    let arr = global.mockDB?.ncos || [];
    const newArr = arr.filter(i => i.id !== id);
    if (newArr.length === arr.length) return res.status(404).json({ message: 'غير موجود' });
    global.mockDB.ncos = newArr;
    return res.json({ message: 'تم الحذف' });
  }

  try {
    const deleted = await NCO.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'ضابط الصف غير موجود' });
    res.json({ message: 'تم الحذف' });
  } catch (error) {
    console.error('Error deleting NCO:', error);
    res.status(500).json({ message: 'خطأ في الحذف' });
  }
});

module.exports = router;