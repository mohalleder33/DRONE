import React, { useState } from 'react';
import { ATTENDANCE_OPTIONS } from '../../constants/courseConstants';

const EditTraineeModal = ({ trainee, onClose, onSave }) => {
  const [grade, setGrade] = useState(trainee.grade || 0);
  const [ranking, setRanking] = useState(trainee.ranking || 0);
  const [attendance, setAttendance] = useState(trainee.attendance || 'حاضر');
  const handleSubmit = () => { onSave(grade, ranking, attendance); onClose(); };
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 p-6 rounded w-96"><h3 className="text-xl font-bold mb-4">تعديل بيانات الدارس</h3><label>الدرجة</label><input type="number" value={grade} onChange={(e)=>setGrade(parseInt(e.target.value))} className="w-full border p-2 my-2 rounded" /><label>الترتيب</label><input type="number" value={ranking} onChange={(e)=>setRanking(parseInt(e.target.value))} className="w-full border p-2 my-2 rounded" /><label>الحضور</label><select value={attendance} onChange={(e)=>setAttendance(e.target.value)} className="w-full border p-2 my-2 rounded">{ATTENDANCE_OPTIONS.map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}</select><div className="flex justify-end gap-2"><button onClick={onClose}>إلغاء</button><button onClick={handleSubmit}>حفظ</button></div></div></div>);
};
export default EditTraineeModal;