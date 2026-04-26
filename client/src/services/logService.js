import api from './api';

export const getLogs = (page = 1, limit = 50, filters = {}) => {
  const params = { page, limit, ...filters };
  return api.get('/logs', { params });
};