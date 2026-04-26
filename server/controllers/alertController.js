const Alert = require('../models/Alert');
const Notification = require('../models/Notification');

// جلب التنبيهات (للمسؤول فقط)
const getAlerts = async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'commander') {
    return res.status(403).json({ message: 'غير مصرح' });
  }
  
  try {
    const { resolved = false, limit = 50, page = 1 } = req.query;
    const query = { isResolved: resolved === 'true' };
    
    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('targetUsers', 'name');
    
    const total = await Alert.countDocuments(query);
    
    res.json({
      data: alerts,
      pagination: { page: parseInt(page), pages: Math.ceil(total / limit), total, limit: parseInt(limit) }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'خطأ في جلب التنبيهات' });
  }
};

// تحديد تنبيه كمُحل
const resolveAlert = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'غير مصرح' });
  }
  
  try {
    const { id } = req.params;
    const alert = await Alert.findByIdAndUpdate(
      id,
      { isResolved: true, resolvedAt: new Date() },
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ message: 'التنبيه غير موجود' });
    }
    
    res.json({ message: 'تم حل التنبيه', alert });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ message: 'خطأ في حل التنبيه' });
  }
};

// إنشاء تنبيه يدوي (للمسؤول)
const createAlert = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'غير مصرح' });
  }
  
  try {
    const { type, title, message, severity, targetUsers, targetPlatformId, targetCourseId, metadata } = req.body;
    
    const alert = new Alert({
      type,
      title,
      message,
      severity: severity || 'warning',
      targetUsers,
      targetPlatformId,
      targetCourseId,
      metadata
    });
    
    await alert.save();
    res.status(201).json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ message: 'فشل إنشاء التنبيه' });
  }
};

module.exports = { getAlerts, resolveAlert, createAlert };