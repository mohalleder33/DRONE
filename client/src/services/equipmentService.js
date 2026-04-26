import api from './api';

export const getEquipment = (page = 1, limit = 10, filters = {}) => {
  const params = { page, limit, ...filters };
  return api.get('/equipment', { params });
};
export const getGroupedEquipment = async () => {
  try {
    const res = await api.get('/equipment/grouped');
    return res.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.data || error.message);
    throw error;
  }
};
export const getCriticalEquipment = () => api.get('/equipment/critical');
export const getWorkshopEquipment = (filters = {}) => api.get('/equipment/workshop', { params: filters });
export const createEquipment = (data) => api.post('/equipment', data);
export const bulkAddEquipment = (data) => api.post('/equipment/bulk', data);
export const updateEquipment = (id, data) => api.put(`/equipment/${id}`, data);
export const deleteEquipment = (id) => api.delete(`/equipment/${id}`);
export const distributeEquipment = (id, platformName) => api.post(`/equipment/distribute/${id}`, { platformName });
export const returnEquipment = (id) => api.post(`/equipment/return/${id}`);
export const sendToWorkshop = (id, faultDescription) => api.post(`/equipment/send-to-workshop/${id}`, { faultDescription });
export const returnFromWorkshop = (id, repairNotes) => api.post(`/equipment/return-from-workshop/${id}`, { repairNotes });
export const retireEquipment = (id, reason) => api.post(`/equipment/retire/${id}`, { reason });
export const updateFaultDescription = (id, faultDescription) => api.put(`/equipment/workshop/${id}/fault`, { faultDescription });