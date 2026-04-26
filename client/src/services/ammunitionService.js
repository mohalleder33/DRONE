import api from './api';

export const getAmmunition = (page = 1, limit = 10, filters = {}) => {
  const params = { page, limit, ...filters };
  return api.get('/ammunition', { params });
};
export const getAmmunitionOverview = () => api.get('/ammunition/overview');
export const getCriticalAmmunition = () => api.get('/ammunition/critical');
export const getAmmunitionStock = (id) => api.get(`/ammunition/${id}/stock`);
export const createAmmunition = (data) => api.post('/ammunition', data);
export const updateAmmunition = (id, data) => api.put(`/ammunition/${id}`, data);
export const deleteAmmunition = (id) => api.delete(`/ammunition/${id}`);
export const addToWarehouse = (id, quantity) => api.post(`/ammunition/add-to-warehouse/${id}`, { quantity });
export const distributeAmmunition = (id, platformId, quantity) => api.post(`/ammunition/distribute/${id}`, { platformId, quantity });
export const returnAmmunition = (id, platformId, quantity) => {
  return api.post(`/ammunition/return/${id}`, { platformId, quantity });
};
export const updateMinThreshold = (stockId, newThreshold) => api.put(`/ammunition/update-threshold/${stockId}`, { minThreshold: newThreshold });
export const scrapAmmunition = (id, locationType, locationId, quantity, reason) => api.post(`/ammunition/scrap/${id}`, { locationType, locationId, quantity, reason });
export const applyCriticalThresholdToAll = () => api.post('/ammunition/apply-critical-threshold');