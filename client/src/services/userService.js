import api from './api';

// جلب جميع المستخدمين
export const getUsers = () => api.get('/users');

// جلب مستخدم بواسطة المعرف
export const getUserById = (id) => api.get(`/users/${id}`);

// إنشاء مستخدم جديد
export const createUser = (data) => api.post('/users', data);

// تحديث مستخدم
export const updateUser = (id, data) => api.put(`/users/${id}`, data);

// حذف مستخدم
export const deleteUser = (id) => api.delete(`/users/${id}`);