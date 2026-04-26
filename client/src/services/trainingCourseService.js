import api from './api';

// ============== الدورات التدريبية الأساسية ==============

// جلب قائمة الدورات مع ترحيل وفلترة
export const getCourses = (page = 1, limit = 10, filters = {}) => {
  const params = { page, limit, ...filters };
  return api.get('/training-courses', { params });
};

// جلب قائمة الدورات (بدون ترحيل - للقوائم المنسدلة)
export const getCoursesList = (limit = 100) => {
  return api.get('/training-courses', { params: { page: 1, limit } });
};

// جلب دورة محددة بواسطة المعرف
export const getCourseById = (id) => {
  if (!id || id === 'undefined') {
    console.error('Invalid course ID:', id);
    return Promise.reject(new Error('معرف الدورة غير صالح'));
  }
  return api.get(`/training-courses/${id}`);
};

// إنشاء دورة جديدة
export const createCourse = (data) => api.post('/training-courses', data);

// تحديث دورة
export const updateCourse = (id, data) => api.put(`/training-courses/${id}`, data);

// حذف دورة
export const deleteCourse = (id) => api.delete(`/training-courses/${id}`);

// ============== إدارة حالة الدورة ==============

// تغيير حالة الدورة (قادمة، جارية، منتهية، ملغاة)
export const updateCourseStatus = (id, status) => api.patch(`/training-courses/${id}/status`, { status });

// ============== إدارة الدارسين ==============

// إضافة دارس من قاعدة البيانات (ضابط، ضابط صف، مستنفر)
export const addTraineeFromDatabase = (courseId, personnelId, type) => {
  if (!courseId || courseId === 'undefined') {
    return Promise.reject(new Error('معرف الدورة غير صالح'));
  }
  return api.post(`/training-courses/${courseId}/add-trainee`, { personnelId, type });
};

// إضافة دارس يدوياً (إنشاء كادر جديد)
export const addManualTrainee = (courseId, traineeData) => {
  if (!courseId || courseId === 'undefined') {
    return Promise.reject(new Error('معرف الدورة غير صالح'));
  }
  return api.post(`/training-courses/${courseId}/add-manual-trainee`, traineeData);
};

// إزالة دارس من الدورة
export const removeTrainee = (courseId, traineeId) => {
  if (!courseId || courseId === 'undefined') {
    return Promise.reject(new Error('معرف الدورة غير صالح'));
  }
  return api.delete(`/training-courses/${courseId}/trainee/${traineeId}`);
};

// تحديث درجة وترتيب دارس
export const updateTraineeGrade = (courseId, traineeId, grade, ranking) => {
  if (!courseId || courseId === 'undefined') {
    return Promise.reject(new Error('معرف الدورة غير صالح'));
  }
  return api.put(`/training-courses/${courseId}/trainee/${traineeId}`, { grade, ranking });
};

// تحديث حضور دارس
export const updateTraineeAttendance = (courseId, traineeId, attendance) => {
  if (!courseId || courseId === 'undefined') {
    return Promise.reject(new Error('معرف الدورة غير صالح'));
  }
  return api.patch(`/training-courses/${courseId}/trainee/${traineeId}/attendance`, { attendance });
};

// ============== التقارير ==============

// جلب تقرير الدورة
export const getCourseReport = (courseId) => {
  if (!courseId || courseId === 'undefined') {
    console.error('Invalid course ID:', courseId);
    return Promise.reject(new Error('معرف الدورة غير صالح'));
  }
  return api.get(`/reports/course/${courseId}`);
};

// تصدير تقرير الدورة (Excel أو PDF)
export const exportCourseReport = (courseId, format = 'excel') => {
  if (!courseId) return Promise.reject('Invalid course ID');
  return api.get(`/training-courses/${courseId}/export?format=${format}`, { responseType: 'blob' });
};

// ============== الشهادات ==============

// جلب بيانات شهادة الدارس
export const getCertificateData = (courseId, traineeId) => {
  if (!courseId || courseId === 'undefined') {
    return Promise.reject(new Error('معرف الدورة غير صالح'));
  }
  return api.get(`/training-courses/${courseId}/certificate/${traineeId}`);
};

// ============== الكوادر المتاحة ==============

// جلب الكوادر المتاحة للتسجيل في الدورة (الحاضرون في الرئاسة)
export const getAvailablePersonnel = () => api.get('/personnel/available-for-course');

// ============== نسخ الدورة وإشعارات ==============

// نسخ دورة (إنشاء دورة جديدة بناءً على دورة موجودة)
export const copyCourse = (courseId, newData) => {
  if (!courseId || courseId === 'undefined') {
    return Promise.reject(new Error('معرف الدورة غير صالح'));
  }
  return api.post(`/training-courses/${courseId}/copy`, newData);
};

// إرسال إشعار لجميع الدارسين في الدورة
export const sendNotificationToTrainees = (courseId, message) => {
  if (!courseId || courseId === 'undefined') {
    return Promise.reject(new Error('معرف الدورة غير صالح'));
  }
  return api.post(`/training-courses/${courseId}/notify`, { message });
};

// ============== ملفات الدورة ==============

// رفع ملف للدورة
export const uploadCourseFile = (courseId, file) => {
  if (!courseId || courseId === 'undefined') {
    return Promise.reject(new Error('معرف الدورة غير صالح'));
  }
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/training-courses/${courseId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// جلب قائمة ملفات الدورة
export const getCourseFiles = (courseId) => {
  if (!courseId || courseId === 'undefined') {
    return Promise.reject(new Error('معرف الدورة غير صالح'));
  }
  return api.get(`/training-courses/${courseId}/files`);
};

// حذف ملف من الدورة
export const deleteCourseFile = (courseId, fileId) => {
  if (!courseId || courseId === 'undefined') {
    return Promise.reject(new Error('معرف الدورة غير صالح'));
  }
  return api.delete(`/training-courses/${courseId}/files/${fileId}`);
};