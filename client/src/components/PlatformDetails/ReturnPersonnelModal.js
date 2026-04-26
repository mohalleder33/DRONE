import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ReturnPersonnelModal = ({ personnel, platformId, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const handleReturn = async () => { if(!reason) return toast.error('أدخل سبب الإعادة'); setLoading(true); try { await api.post('/personnel/return', { type: personnel.type, id: personnel.id, platformId, reason, details }); toast.success('تم الإعادة'); onSuccess(); onClose(); } catch(e){ toast.error('فشل الإعادة'); } finally { setLoading(false); } };
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96"><h3 className="text-xl font-bold mb-4">إعادة {personnel.name}</h3><select value={reason} onChange={(e)=>setReason(e.target.value)} className="w-full border p-2 mb-2 rounded"><option value="">اختر سبب الإعادة</option><option value="انتهاء المأمورية">انتهاء المأمورية</option><option value="نقل">نقل</option><option value="عقاب">عقاب</option><option value="إجازة">إجازة</option><option value="أخرى">أخرى</option></select><textarea placeholder="تفاصيل إضافية" value={details} onChange={(e)=>setDetails(e.target.value)} className="w-full border p-2 rounded" rows="2"></textarea><div className="flex justify-end gap-2 mt-4"><button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">إلغاء</button><button onClick={handleReturn} disabled={loading} className="px-4 py-2 bg-yellow-600 text-white rounded">تأكيد</button></div></div></div>);
};
export default ReturnPersonnelModal;