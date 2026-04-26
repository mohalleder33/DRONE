import api from './api';

export const getDashboardPersonnel = () => api.get('/dashboard/personnel');
export const getDashboardEquipment = () => api.get('/dashboard/equipment');
export const getDashboardAmmunition = () => api.get('/dashboard/ammunition');
export const getUpcomingRotations = () => api.get('/dashboard/upcoming-rotations');