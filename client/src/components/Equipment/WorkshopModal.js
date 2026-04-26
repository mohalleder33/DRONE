import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { sendToWorkshop } from '../../services/equipmentService';

const WorkshopModal = ({ equipment, onClose, onSuccess }) => {
  const [fault, setFault] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => { if(!fault.trim()) return toast.error('أدخل وصف العطل'); setLoading(true); try { await sendToWorkshop(equipment.id, fault); toast.success('تم الإرسال للورشة'); onSuccess(); onClose(); } catch(e){ toast.error('فشل الإرسال'); } finally { setLoading(false); } };
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 p-6 rounded w-96"><h3>إرسال للورشة</h3><p>{equipment.name} - {equipment.serialNumber}</p><textarea placeholder="وصف العطل" value={fault} onChange={(e)=>setFault(e.target.value)} className="w-full border p-2 my-2" rows="3" required /><div className="flex justify-end gap-2"><button onClick={onClose}>إلغاء</button><button onClick={handleSubmit} disabled={loading}>إرسال</button></div></div></div>);
};
export default WorkshopModal;