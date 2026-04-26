import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { deleteEquipment } from '../../services/equipmentService';

const ConfirmDeleteModal = ({ equipment, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => { setLoading(true); try { await deleteEquipment(equipment.id); toast.success('تم الحذف'); onSuccess(); onClose(); } catch(e){ toast.error('فشل الحذف'); } finally { setLoading(false); } };
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 p-6 rounded w-96"><h3 className="text-red-600">تأكيد الحذف</h3><p>هل أنت متأكد من حذف {equipment.name} - {equipment.serialNumber}؟</p><div className="flex justify-end gap-2 mt-4"><button onClick={onClose}>إلغاء</button><button onClick={handleDelete} disabled={loading}>حذف</button></div></div></div>);
};
export default ConfirmDeleteModal;