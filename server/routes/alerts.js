const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAlerts, resolveAlert, createAlert } = require('../controllers/alertController');

// GET /api/alerts - جلب التنبيهات (للمسؤول والقائد)
router.get('/', auth, getAlerts);

// POST /api/alerts - إنشاء تنبيه يدوي (للمسؤول فقط)
router.post('/', auth, createAlert);

// PUT /api/alerts/:id/resolve - حل تنبيه (للمسؤول فقط)
router.put('/:id/resolve', auth, resolveAlert);

// GET /api/alerts/settings - جلب إعدادات التنبيهات
router.get('/settings', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'غير مصرح' });
  }
  
  const defaultAlerts = [
    { type: 'low_ammunition', name: 'مخزون ذخائر منخفض', description: 'عند وصول المخزون للحد الحرج', enabled: true, threshold: 100 },
    { type: 'rotation_end', name: 'نهاية مأمورية وشيكة', description: 'قبل انتهاء المأمورية بعدد أيام', enabled: true, threshold: 7 },
    { type: 'workshop_duration', name: 'مكث في الورشة', description: 'أيام مكث في الورشة', enabled: true, threshold: 14 },
    { type: 'service_completion', name: 'اكتمال الخدمة', description: 'عند اكتمال مدة الخدمة', enabled: true, threshold: 30 },
    { type: 'course_expired', name: 'دورة منتهية', description: 'عند انتهاء دورة تدريبية', enabled: true, threshold: 0 },
    { type: 'disabled_platform', name: 'منصة معطلة', description: 'عند بقاء منصة معطلة لفترة', enabled: true, threshold: 30 }
  ];
  
  const alerts = global.mockDB?.alertSettings || defaultAlerts;
  res.json(alerts);
});

// PUT /api/alerts/settings/:type - تحديث إعدادات تنبيه
router.put('/settings/:type', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'غير مصرح' });
  }
  
  const { type } = req.params;
  const { enabled, threshold } = req.body;
  
  let alerts = global.mockDB?.alertSettings || [];
  const index = alerts.findIndex(a => a.type === type);
  if (index === -1) {
    return res.status(404).json({ message: 'نوع التنبيه غير موجود' });
  }
  
  alerts[index] = { ...alerts[index], ...req.body };
  if (!global.mockDB) global.mockDB = {};
  global.mockDB.alertSettings = alerts;
  
  res.json(alerts[index]);
});

module.exports = router;