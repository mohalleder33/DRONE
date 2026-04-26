import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { retireEquipment } from '../../services/equipmentService';

const RetireFromWorkshopModal = ({ equipment, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const handle = async () => { if(!reason.trim()) return toast.error('أدخل سبب الإخراج'); setLoading(true); try { await retireEquipment(equipment.id, reason); toast.success('تم إخراج المعدة'); onSuccess(); onClose(); } catch(e){ toast.error('فشل الإخراج'); } finally { setLoading(false); } };
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 p-6 rounded w-96"><h3 className="text-red-600">إخراج المعدة من الخدمة</h3><p>{equipment.name}</p><textarea placeholder="سبب الإخراج" value={reason} onChange={(e)=>setReason(e.target.value)} className="w-full border p-2 my-2" rows="2" required /><div className="flex justify-end gap-2"><button onClick={onClose}>إلغاء</button><button onClick={handle} disabled={loading}>تأكيد</button></div></div></div>);
};
export default RetireFromWorkshopModal;