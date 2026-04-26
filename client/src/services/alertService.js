import api from './api';

export const getAlertSettings = () => api.get('/alerts/settings');
export const updateAlertSetting = (type, data) => api.put(`/alerts/settings/${type}`, data);