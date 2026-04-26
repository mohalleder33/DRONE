import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ReturnEquipmentModal = ({ equipment, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const handleReturn = async () => { setLoading(true); try { await api.post(`/equipment/return/${equipment.id}`); toast.success('تم الإعادة'); onSuccess(); onClose(); } catch(e){ toast.error('فشل الإعادة'); } finally { setLoading(false); } };
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96"><h3 className="text-xl font-bold mb-4">إعادة المعدة</h3><p>هل أنت متأكد من إعادة {equipment.name} - {equipment.serialNumber} إلى المستودع؟</p><div className="flex justify-end gap-2 mt-4"><button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">إلغاء</button><button onClick={handleReturn} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">تأكيد</button></div></div></div>);
};
export default ReturnEquipmentModal;