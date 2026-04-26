import api from './api';

// الضباط
export const getOfficers = (page, limit, filters) => api.get('/officers', { params: { page, limit, ...filters } });
export const getOfficerById = (id) => api.get(`/officers/${id}`);
export const createOfficer = (data) => api.post('/officers', data);
export const updateOfficer = (id, data) => api.put(`/officers/${id}`, data);
export const deleteOfficer = (id) => api.delete(`/officers/${id}`);

// ضباط الصف
export const getNCOs = (page, limit, filters) => api.get('/ncos', { params: { page, limit, ...filters } });
export const getNCOById = (id) => api.get(`/ncos/${id}`);
export const createNCO = (data) => api.post('/ncos', data);
export const updateNCO = (id, data) => api.put(`/ncos/${id}`, data);
export const deleteNCO = (id) => api.delete(`/ncos/${id}`);

// المستنفرين
export const getRecruits = (page, limit, filters) => api.get('/recruits', { params: { page, limit, ...filters } });
export const getRecruitById = (id) => api.get(`/recruits/${id}`);
export const createRecruit = (data) => api.post('/recruits', data);
export const updateRecruit = (id, data) => api.put(`/recruits/${id}`, data);
export const deleteRecruit = (id) => api.delete(`/recruits/${id}`);

// التعيين والإعادة
export const assignToPlatform = (type, id, platformId, startDate, endDate) =>
  api.post('/personnel/assign', { type, id, platformId, startDate, endDate });

export const returnFromPlatform = (type, id, platformId, reason, details) =>
  api.post('/personnel/return', { type, id, platformId, reason, details });

export const updateRotationEndDate = (type, id, newEndDate) =>
  api.put(`/personnel/rotation/${type}/${id}`, { endDate: newEndDate });