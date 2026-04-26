import React, { useState } from 'react';
import { updateCourseStatus } from '../../services/trainingCourseService';
import toast from 'react-hot-toast';
import { COURSE_STATUS } from '../../constants/courseConstants';

const UpdateCourseStatusModal = ({ course, onClose, onSuccess }) => {
  const [status, setStatus] = useState(course.status);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => { setLoading(true); try { await updateCourseStatus(course.id, status); toast.success('تم تحديث الحالة'); onSuccess(); onClose(); } catch(e){ toast.error('فشل التحديث'); } finally { setLoading(false); } };
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 p-6 rounded w-96"><h3>تغيير حالة الدورة</h3><select value={status} onChange={(e)=>setStatus(e.target.value)} className="w-full border p-2 my-4 rounded">{COURSE_STATUS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select><div className="flex justify-end gap-2"><button onClick={onClose}>إلغاء</button><button onClick={handleSubmit} disabled={loading}>تحديث</button></div></div></div>);
};
export default UpdateCourseStatusModal;