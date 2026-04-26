import api from './api';

// جلب الإشعارات
export const getNotifications = (limit = 20, offset = 0) => {
  return api.get('/notifications', { params: { limit, offset } });
};

// جلب عدد الإشعارات غير المقروءة
export const getUnreadCount = () => api.get('/notifications/unread-count');

// تحديد إشعار كمقروء
export const markAsRead = (id) => api.put(`/notifications/${id}/read`);

// تحديد الكل كمقروء
export const markAllAsRead = () => api.put('/notifications/read-all');

// حذف إشعار
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);

// ============== التنبيهات ==============

// جلب التنبيهات
export const getAlerts = (resolved = false, page = 1, limit = 50) => {
  return api.get('/alerts', { params: { resolved, page, limit } });
};

// حل تنبيه
export const resolveAlert = (id) => api.put(`/alerts/${id}/resolve`);

// إنشاء تنبيه يدوي (للمسؤول)
export const createAlert = (data) => api.post('/alerts', data);