import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { createPlatform } from '../../services/platformsService';

const AddPlatformModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', location: '', maxPersonnel: '', maxEquipment: '' });
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location) return toast.error('الاسم والموقع مطلوبان');
    setLoading(true);
    try { await createPlatform(formData); toast.success('تم إنشاء المنصة'); onSuccess(); onClose(); } catch (error) { toast.error('فشل الإنشاء'); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96"><h2 className="text-xl font-bold mb-4">إضافة منصة جديدة</h2>
        <form onSubmit={handleSubmit}><input name="name" placeholder="الاسم *" onChange={handleChange} className="w-full border p-2 mb-2 rounded" required /><input name="location" placeholder="الموقع *" onChange={handleChange} className="w-full border p-2 mb-2 rounded" required /><input name="maxPersonnel" type="number" placeholder="الحد الأقصى للكوادر" onChange={handleChange} className="w-full border p-2 mb-2 rounded" /><input name="maxEquipment" type="number" placeholder="الحد الأقصى للمعدات" onChange={handleChange} className="w-full border p-2 mb-4 rounded" /><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">إلغاء</button><button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">إضافة</button></div></form>
      </div>
    </div>
  );
};
export default AddPlatformModal;