import api from './api';

export const login = (username, password) => api.post('/auth/login', { username, password });
export const changePassword = (oldPassword, newPassword) => api.post('/auth/change-password', { oldPassword, newPassword });
export const updateProfile = (data) => api.put('/users/profile', data);