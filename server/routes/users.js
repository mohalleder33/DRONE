const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { can } = require('../middleware/permission');
const router = express.Router();

// جلب جميع المستخدمين (للمسؤول فقط)
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'غير مصرح بالوصول' });
  }
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// إنشاء مستخدم جديد (للمسؤول فقط)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'غير مصرح' });
  }
  const { name, username, email, password, role, assignedPlatformId, rank, militaryId } = req.body;
  
  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'اسم المستخدم أو البريد الإلكتروني موجود مسبقاً' });
    }
    
    const newUser = new User({
      name,
      username,
      email,
      password,
      role: role || 'viewer',
      assignedPlatformId: role === 'platformCommander' ? assignedPlatformId : null,
      rank: rank || '',
      militaryId: militaryId || ''
    });
    
    await newUser.save();
    const { password: _, ...userWithoutPassword } = newUser.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'فشل إنشاء المستخدم' });
  }
});

// تحديث مستخدم (للمسؤول فقط)
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'غير مصرح' });
  }
  const { id } = req.params;
  const { name, username, email, password, role, assignedPlatformId, rank, militaryId } = req.body;
  
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    user.name = name || user.name;
    user.username = username || user.username;
    user.email = email || user.email;
    user.role = role || user.role;
    user.assignedPlatformId = (role === 'platformCommander' && assignedPlatformId) ? assignedPlatformId : null;
    user.rank = rank || user.rank;
    user.militaryId = militaryId || user.militaryId;
    
    if (password) {
      user.password = password;
    }
    
    await user.save();
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'فشل تحديث المستخدم' });
  }
});

// حذف مستخدم (للمسؤول فقط)
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'غير مصرح' });
  }
  const { id } = req.params;
  
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    res.json({ message: 'تم حذف المستخدم' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'فشل حذف المستخدم' });
  }
});

module.exports = router;