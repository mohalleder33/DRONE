import api from './api';

// ============== التقارير العامة ==============
export const getGeneralDailyStats = () => api.get('/reports/general-daily-stats');

export const getPersonnelList = (location = 'general', platformId = null, courseId = null) => {
  const params = { location };
  if (platformId) params.platformId = platformId;
  if (courseId) params.courseId = courseId;
  return api.get('/reports/personnel-list', { params });
};

// ============== تقارير الرئاسة ==============
export const getHeadquartersReport = () => api.get('/reports/headquarters');
export const getHeadquartersPersonnel = () => api.get('/reports/headquarters/personnel');
export const getHeadquartersEquipment = () => api.get('/reports/headquarters/equipment');
export const getHeadquartersAmmunition = () => api.get('/reports/headquarters/ammunition');

// ============== تقارير المنصات ==============
export const getPlatformReport = (platformId) => api.get(`/reports/platform/${platformId}`);
export const getPlatformPersonnel = (platformId) => api.get(`/reports/platform/${platformId}/personnel`);
export const getPlatformEquipment = (platformId) => api.get(`/reports/platform/${platformId}/equipment`);
export const getPlatformAmmunition = (platformId) => api.get(`/reports/platform/${platformId}/ammunition`);

// ============== تقارير المعدات والذخائر العامة ==============
export const getGlobalEquipmentReport = () => api.get('/reports/equipment/global');
export const getGlobalAmmunitionReport = () => api.get('/reports/ammunition/global');

// ============== تقارير الدورات التدريبية ==============
export const getCourseReport = (courseId) => api.get(`/reports/course/${courseId}`);

// ============== سجل العمليات ==============
export const getLogsReport = (filters = {}, page = 1, limit = 50) => {
  const params = { ...filters, page, limit };
  return api.get('/reports/logs', { params });
};

// ============== تقارير إضافية ==============
export const getPlatformsList = () => api.get('/platforms', { params: { limit: 100 } });
export const getCoursesList = () => api.get('/training-courses', { params: { limit: 100 } });
export const getEquipmentReport = (location) => {
  const token = localStorage.getItem('token');
  return axios.get(`${process.env.REACT_APP_API_URL}/reports/equipment`, {
    params: { location },
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const getAmmunitionReport = (location) => {
  const token = localStorage.getItem('token');
  return axios.get(`${process.env.REACT_APP_API_URL}/reports/ammunition`, {
    params: { location },
    headers: { Authorization: `Bearer ${token}` }
  });
};