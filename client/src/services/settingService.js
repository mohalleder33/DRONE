// settingService.js
import api from './api';
export const getAllSettings = () => api.get('/settings');
export const updateSetting = (key, value) => api.put('/settings', { key, value });
export const resetAllSettings = () => api.post('/settings/reset');
export const applyCriticalThresholdToAll = () => api.post('/settings/apply-critical-threshold');