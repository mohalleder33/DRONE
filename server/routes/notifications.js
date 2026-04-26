const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../services/notificationService');

// GET /api/notifications - جلب إشعارات المستخدم
router.get('/', auth, async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  
  try {
    const result = await getUserNotifications(req.user._id, parseInt(limit), parseInt(offset));
    res.json(result.notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'فشل تحميل الإشعارات' });
  }
});

// GET /api/notifications/unread-count - جلب عدد الإشعارات غير المقروءة
router.get('/unread-count', auth, async (req, res) => {
  try {
    const result = await getUserNotifications(req.user._id, 1, 0);
    res.json({ count: result.unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'فشل تحميل عدد الإشعارات' });
  }
});

// PUT /api/notifications/:id/read - تحديد إشعار كمقروء
router.put('/:id/read', auth, async (req, res) => {
  const { id } = req.params;
  
  try {
    const notification = await markAsRead(id, req.user._id);
    if (!notification) {
      return res.status(404).json({ message: 'الإشعار غير موجود' });
    }
    res.json({ message: 'تم تحديد الإشعار كمقروء' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'فشل تحديث الإشعار' });
  }
});

// PUT /api/notifications/read-all - تحديد جميع الإشعارات كمقروءة
router.put('/read-all', auth, async (req, res) => {
  try {
    await markAllAsRead(req.user._id);
    res.json({ message: 'تم تحديد جميع الإشعارات كمقروءة' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'فشل تحديث الإشعارات' });
  }
});

// DELETE /api/notifications/:id - حذف إشعار
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  
  try {
    const deleted = await deleteNotification(id, req.user._id);
    if (!deleted) {
      return res.status(404).json({ message: 'الإشعار غير موجود' });
    }
    res.json({ message: 'تم حذف الإشعار' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'فشل حذف الإشعار' });
  }
});

module.exports = router;