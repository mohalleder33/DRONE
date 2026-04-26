import api from './api';

export const getNotificationPreferences = () => api.get('/user/preferences/notifications');
export const updateNotificationPreferences = (prefs) => api.put('/user/preferences/notifications', prefs);