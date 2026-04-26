import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { returnFromWorkshop } from '../../services/equipmentService';

const ReturnFromWorkshopModal = ({ equipment, onClose, onSuccess }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => { setLoading(true); try { await returnFromWorkshop(equipment.id, notes); toast.success('تمت الإعادة من الورشة'); onSuccess(); onClose(); } catch(e){ toast.error('فشل الإعادة'); } finally { setLoading(false); } };
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 p-6 rounded w-96"><h3>إعادة من الورشة</h3><p>{equipment.name}</p><textarea placeholder="ملاحظات الإصلاح" value={notes} onChange={(e)=>setNotes(e.target.value)} className="w-full border p-2 my-2" rows="2" /><div className="flex justify-end gap-2"><button onClick={onClose}>إلغاء</button><button onClick={handleSubmit} disabled={loading}>تأكيد</button></div></div></div>);
};
export default ReturnFromWorkshopModal;