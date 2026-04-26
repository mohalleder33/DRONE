import React, { useState, useEffect } from 'react';
import { getCourseById, updateTraineeAttendance } from '../../services/trainingCourseService';
import toast from 'react-hot-toast';
import { ATTENDANCE_OPTIONS } from '../../constants/courseConstants';

const TraineeAttendanceModal = ({ course, onClose, onRefresh }) => {
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => { setLoading(true); getCourseById(course.id).then(res=>setTrainees(res.data.trainees||[])).catch(()=>toast.error('فشل التحميل')).finally(()=>setLoading(false)); }, [course.id]);
  const handleChange = async (id, value) => { try { await updateTraineeAttendance(course.id, id, value); setTrainees(prev=>prev.map(t=>t.id===id?{...t, attendance:value}:t)); toast.success('تم التحديث'); if(onRefresh) onRefresh(); } catch(e){ toast.error('فشل التحديث'); } };
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl"><h3 className="text-xl font-bold mb-4">إدارة الحضور - {course.courseName}</h3>{loading?<div>جاري التحميل...</div>:<div className="overflow-x-auto"><table className="min-w-full"><thead><tr><th>الاسم</th><th>الرتبة</th><th>الحضور</th></tr></thead><tbody>{trainees.map(t=><tr key={t.id} className="border-t"><td className="p-2">{t.name}</td><td className="p-2">{t.rank}</td><td className="p-2"><select value={t.attendance} onChange={(e)=>handleChange(t.id, e.target.value)} className="border rounded p-1">{ATTENDANCE_OPTIONS.map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></td></tr>)}</tbody></table></div>}<div className="flex justify-end gap-2 mt-4"><button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">إغلاق</button></div></div></div>);
};
export default TraineeAttendanceModal;