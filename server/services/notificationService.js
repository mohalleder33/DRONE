const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * إنشاء إشعار جديد لمستخدم معين
 */
const createNotification = async (userId, title, message, type = 'system', metadata = {}) => {
  try {
    const notification = new Notification({
      user: userId,
      title,
      message,
      type,
      metadata,
      read: false
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * إنشاء إشعار لعدة مستخدمين
 */
const createBulkNotifications = async (userIds, title, message, type = 'system', metadata = {}) => {
  const notifications = userIds.map(userId => ({
    user: userId,
    title,
    message,
    type,
    metadata,
    read: false
  }));
  try {
    await Notification.insertMany(notifications);
    return true;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return false;
  }
};

/**
 * جلب إشعارات المستخدم
 */
const getUserNotifications = async (userId, limit = 20, offset = 0) => {
  try {
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
    const total = await Notification.countDocuments({ user: userId });
    const unreadCount = await Notification.countDocuments({ user: userId, read: false });
    
    return { notifications, total, unreadCount };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { notifications: [], total: 0, unreadCount: 0 };
  }
};

/**
 * تحديد إشعار كمقروء
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return null;
  }
};

/**
 * تحديد جميع إشعارات المستخدم كمقروءة
 */
const markAllAsRead = async (userId) => {
  try {
    await Notification.updateMany({ user: userId, read: false }, { read: true });
    return true;
  } catch (error) {
    console.error('Error marking all as read:', error);
    return false;
  }
};

/**
 * حذف إشعار
 */
const deleteNotification = async (notificationId, userId) => {
  try {
    await Notification.findOneAndDelete({ _id: notificationId, user: userId });
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};

/**
 * إرسال إشعار فوري عبر Socket.io
 */
const sendRealtimeNotification = (io, userId, notification) => {
  if (io && userId) {
    io.to(`user_${userId}`).emit('new_notification', notification);
  }
};

module.exports = {
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendRealtimeNotification
};