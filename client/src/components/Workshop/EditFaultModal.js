import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { updateFaultDescription } from '../../services/equipmentService';

const EditFaultModal = ({ equipment, onClose, onSuccess }) => {
  const [fault, setFault] = useState(equipment.faultDescription||'');
  const [loading, setLoading] = useState(false);
  const handle = async () => { if(!fault.trim()) return toast.error('أدخل وصف العطل'); setLoading(true); try { await updateFaultDescription(equipment.id, fault); toast.success('تم التحديث'); onSuccess(); onClose(); } catch(e){ toast.error('فشل التحديث'); } finally { setLoading(false); } };
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 p-6 rounded w-96"><h3>تعديل وصف العطل</h3><textarea value={fault} onChange={(e)=>setFault(e.target.value)} className="w-full border p-2 my-2" rows="3" required /><div className="flex justify-end gap-2"><button onClick={onClose}>إلغاء</button><button onClick={handle} disabled={loading}>حفظ</button></div></div></div>);
};
export default EditFaultModal;