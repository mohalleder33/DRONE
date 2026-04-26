import React, { useState } from 'react';
import { copyCourse } from '../../services/trainingCourseService';
import toast from 'react-hot-toast';

const CopyCourseModal = ({ course, onClose, onSuccess }) => {
  const [newNumber, setNewNumber] = useState(course.courseNumber + '_نسخة');
  const [newStart, setNewStart] = useState(course.startDate);
  const [newEnd, setNewEnd] = useState(course.endDate);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => { setLoading(true); try { await copyCourse(course.id, { courseNumber: newNumber, startDate: newStart, endDate: newEnd }); toast.success('تم نسخ الدورة'); onSuccess(); onClose(); } catch(e){ toast.error('فشل النسخ'); } finally { setLoading(false); } };
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 p-6 rounded w-96"><h3>نسخ الدورة: {course.courseName}</h3><input placeholder="رقم الدورة الجديد" value={newNumber} onChange={(e)=>setNewNumber(e.target.value)} className="w-full border p-2 my-2 rounded" /><label>تاريخ البدء الجديد</label><input type="date" value={newStart} onChange={(e)=>setNewStart(e.target.value)} className="w-full border p-2 my-2 rounded" /><label>تاريخ الانتهاء الجديد</label><input type="date" value={newEnd} onChange={(e)=>setNewEnd(e.target.value)} className="w-full border p-2 my-2 rounded" /><div className="flex justify-end gap-2"><button onClick={onClose}>إلغاء</button><button onClick={handleSubmit} disabled={loading}>نسخ</button></div></div></div>);
};
export default CopyCourseModal;