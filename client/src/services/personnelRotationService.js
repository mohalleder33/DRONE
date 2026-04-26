import api from './api';

/**
 * جلب الكوادر المتاحة للتعيين (غير المعينين)
 * @param {string} type - نوع الكادر (officers, ncos, recruits)
 * @param {number} page - رقم الصفحة
 * @param {number} limit - عدد العناصر
 */
export const getAvailablePersonnel = async (type, page = 1, limit = 20) => {
  const res = await api.get(`/personnel-rotation/available/${type}?page=${page}&limit=${limit}`);
  return res.data;
};

/**
 * تعيين كادر على منصة
 * @param {string} type - نوع الكادر
 * @param {string} id - معرف الكادر
 * @param {string} platformId - معرف المنصة
 * @param {string} startDate - تاريخ البدء
 * @param {string} endDate - تاريخ الانتهاء
 */
export const assignToPlatform = async (type, id, platformId, startDate, endDate) => {
  const res = await api.post(`/personnel-rotation/${type}/${id}/assign`, { platformId, startDate, endDate });
  return res.data.data;
};

/**
 * إعادة كادر من منصة
 * @param {string} type - نوع الكادر
 * @param {string} id - معرف الكادر
 * @param {string} returnReason - سبب الإعادة
 * @param {string} returnDetails - تفاصيل إضافية
 */
export const returnFromPlatform = async (type, id, returnReason, returnDetails) => {
  const res = await api.post(`/personnel-rotation/${type}/${id}/return`, { returnReason, returnDetails });
  return res.data.data;
};

/**
 * تحديث تاريخ انتهاء المأمورية
 * @param {string} type - نوع الكادر
 * @param {string} id - معرف الكادر
 * @param {string} newEndDate - تاريخ الانتهاء الجديد
 */
export const updateRotationEndDate = async (type, id, newEndDate) => {
  const res = await api.put(`/personnel-rotation/${type}/${id}/rotation`, { newEndDate });
  return res.data.data;
};

/**
 * جلب الكوادر المعينين على منصة معينة
 * @param {string} platformId - معرف المنصة
 */
export const getPlatformPersonnel = async (platformId) => {
  const res = await api.get(`/personnel-rotation/platform/${platformId}`);
  return res.data.data;
};

/**
 * نقل كادر بين منصتين
 * @param {string} type - نوع الكادر
 * @param {string} id - معرف الكادر
 * @param {string} fromPlatformId - معرف المنصة المصدر
 * @param {string} toPlatformId - معرف المنصة الهدف
 */
export const transferPersonnel = async (type, id, fromPlatformId, toPlatformId) => {
  const res = await api.post(`/personnel-rotation/${type}/${id}/transfer`, { fromPlatformId, toPlatformId });
  return res.data.data;
};

/**
 * جلب المرشح التالي للتعيين العادل (الأقل خدمة)
 */
export const getNextCandidate = async () => {
  const res = await api.get('/personnel-rotation/next-candidate');
  return res.data.data;
};

/**
 * التعيين التلقائي العادل
 * @param {string} platformId - معرف المنصة
 */
export const autoAssignFair = async (platformId) => {
  const res = await api.post('/personnel-rotation/auto-assign', { platformId });
  return res.data.data;
};