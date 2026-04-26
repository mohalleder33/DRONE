const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// @route   POST /api/auth/login
// @desc    تسجيل الدخول
// @access  Public
router.post('/login', async (req, res) => {
  const { username, email, password } = req.body;
  const loginField = username || email;
  
  console.log('🔐 Login attempt:', { loginField, passwordProvided: !!password });
  
  let user;
  
  // حالة استخدام البيانات الوهمية (Mock Data)
  if (global.mockDB && process.env.USE_MOCK_DB === 'true') {
    console.log('📦 Using Mock DB');
    user = global.mockDB.users.find(u => u.username === loginField || u.email === loginField);
    
    console.log('📖 User found in mock:', user ? { id: user.id, email: user.email, username: user.username } : 'No user');
    
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign(
        { id: user.id, role: user.role, name: user.name, email: user.email }, 
        process.env.JWT_SECRET, 
        { expiresIn: '7d' }
      );
      return res.json({ 
        token, 
        user: { 
          id: user.id, 
          name: user.name, 
          role: user.role, 
          email: user.email, 
          rank: user.rank, 
          militaryId: user.militaryId 
        } 
      });
    }
  } 
  // حالة استخدام قاعدة البيانات الحقيقية (MongoDB)
  else {
    try {
      console.log('🍃 Using MongoDB');
      user = await User.findOne({ 
        $or: [{ username: loginField }, { email: loginField }] 
      });
      
      console.log('📖 User found in DB:', user ? { id: user._id, email: user.email, username: user.username } : 'No user');
      
      if (!user) {
        console.log('❌ User not found');
        return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
      }
      
      const match = await bcrypt.compare(password, user.password);
      console.log('🔐 Password match:', match);
      
      if (!match) {
        console.log('❌ Password mismatch');
        return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
      }
      
      const token = jwt.sign(
        { id: user._id, role: user.role, name: user.name, email: user.email }, 
        process.env.JWT_SECRET, 
        { expiresIn: '7d' }
      );
      
      return res.json({ 
        token, 
        user: { 
          id: user._id, 
          name: user.name, 
          role: user.role, 
          email: user.email, 
          rank: user.rank, 
          militaryId: user.militaryId 
        } 
      });
    } catch (dbError) {
      console.error('❌ Database error:', dbError.message);
      return res.status(500).json({ message: 'خطأ في الخادم، يرجى المحاولة لاحقاً' });
    }
  }
  
  console.log('❌ Login failed: Invalid credentials');
  res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
});

// @route   POST /api/auth/change-password
// @desc    تغيير كلمة المرور
// @access  Private
router.post('/change-password', require('../middleware/auth'), async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'كلمة المرور الحالية والجديدة مطلوبة' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
  }
  
  // حالة Mock Data
  if (process.env.USE_MOCK_DB === 'true' && global.mockDB) {
    const user = global.mockDB.users.find(u => u.id === req.user.id);
    if (user && bcrypt.compareSync(oldPassword, user.password)) {
      user.password = bcrypt.hashSync(newPassword, 10);
      return res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
    }
    return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة' });
  }
  
  // حالة MongoDB
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة' });
    }
    
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    console.error('❌ Change password error:', error.message);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// @route   GET /api/auth/verify
// @desc    التحقق من صحة التوكن
// @access  Private
router.get('/verify', require('../middleware/auth'), async (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;