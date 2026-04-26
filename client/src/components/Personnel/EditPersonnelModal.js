import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { updateOfficer, updateNCO, updateRecruit } from '../../services/personnelService';
import { RANKS, ATTENDANCE_STATUS } from '../../constants/personnelConstants';

const EditPersonnelModal = ({ personnel, type, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', rank: '', militaryId: '', specialization: '', unit: '', attendanceStatus: '' });
 useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        // ✅ استخدام _id إذا كان موجوداً
        const id = personnel._id || personnel.id;
        if (!id) throw new Error('No ID');
        
        let res;
        if (type === 'officers') res = await getOfficerById(id);
        else if (type === 'ncos') res = await getNCOById(id);
        else res = await getRecruitById(id);
        setDetails(res.data);
      } catch (error) {
        toast.error('فشل تحميل التفاصيل');
        setDetails(personnel);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [personnel, type]);
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { if (type === 'officers') await updateOfficer(personnel.id, formData); else if (type === 'ncos') await updateNCO(personnel.id, formData); else await updateRecruit(personnel.id, formData); toast.success('تم التحديث'); onSuccess(); onClose(); } catch (error) { toast.error('فشل التحديث'); } finally { setLoading(false); }
  };
  const rankOptions = RANKS[type];
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded w-96"><h2 className="text-xl font-bold mb-4">تعديل {personnel.name}</h2>
        <form onSubmit={handleSubmit}><input name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 mb-2 rounded" required /><select name="rank" value={formData.rank} onChange={handleChange} className="w-full border p-2 mb-2 rounded">{rankOptions.map(r=><option key={r} value={r}>{r}</option>)}</select><input name="militaryId" value={formData.militaryId} onChange={handleChange} className="w-full border p-2 mb-2 rounded" /><input name="specialization" value={formData.specialization} onChange={handleChange} className="w-full border p-2 mb-2 rounded" /><input name="unit" value={formData.unit} onChange={handleChange} className="w-full border p-2 mb-2 rounded" /><select name="attendanceStatus" value={formData.attendanceStatus} onChange={handleChange} className="w-full border p-2 mb-4 rounded">{ATTENDANCE_STATUS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">إلغاء</button><button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">حفظ</button></div></form>
      </div>
    </div>
  );
};
export default EditPersonnelModal;