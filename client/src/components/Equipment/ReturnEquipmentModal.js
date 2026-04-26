import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { returnEquipment } from '../../services/equipmentService';

const ReturnEquipmentModal = ({ equipment, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => { setLoading(true); try { await returnEquipment(equipment.id); toast.success('تمت الإعادة'); onSuccess(); onClose(); } catch(e){ toast.error('فشل الإعادة'); } finally { setLoading(false); } };
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 p-6 rounded w-96"><h3>إعادة المعدة</h3><p>هل أنت متأكد من إعادة {equipment.name} - {equipment.serialNumber} إلى المستودع؟</p><div className="flex justify-end gap-2"><button onClick={onClose}>إلغاء</button><button onClick={handleSubmit} disabled={loading}>تأكيد</button></div></div></div>);
};
export default ReturnEquipmentModal;