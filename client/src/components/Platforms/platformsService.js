import api from './api';

export const getPlatforms = (page = 1, limit = 10, filters = {}) => {
  const params = { page, limit, ...filters };
  return api.get('/platforms', { params });
};
export const getPlatformById = (id) => api.get(`/platforms/${id}`);
export const getPlatformDetails = (id) => api.get(`/platforms/${id}/details`);
export const createPlatform = (data) => api.post('/platforms', data);
export const updatePlatform = (id, data) => api.put(`/platforms/${id}`, data);
export const deletePlatform = (id) => api.delete(`/platforms/${id}`);
export const disablePlatform = (id) => api.post(`/platforms/${id}/disable`);
export const enablePlatform = (id) => api.post(`/platforms/${id}/enable`);