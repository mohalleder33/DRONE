import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { updatePlatform } from '../../services/platformsService';

const EditPlatformModal = ({ platform, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', location: '', maxPersonnel: '', maxEquipment: '', status: '' });
  useEffect(() => { if(platform) setFormData({ name: platform.name, location: platform.location, maxPersonnel: platform.maxPersonnel || '', maxEquipment: platform.maxEquipment || '', status: platform.status }); }, [platform]);
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await updatePlatform(platform.id, formData); toast.success('تم التحديث'); onSuccess(); onClose(); } catch (error) { toast.error('فشل التحديث'); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96"><h2 className="text-xl font-bold mb-4">تعديل المنصة</h2>
        <form onSubmit={handleSubmit}><input name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 mb-2 rounded" required /><input name="location" value={formData.location} onChange={handleChange} className="w-full border p-2 mb-2 rounded" required /><input name="maxPersonnel" type="number" value={formData.maxPersonnel} onChange={handleChange} className="w-full border p-2 mb-2 rounded" /><input name="maxEquipment" type="number" value={formData.maxEquipment} onChange={handleChange} className="w-full border p-2 mb-2 rounded" /><select name="status" value={formData.status} onChange={handleChange} className="w-full border p-2 mb-4 rounded"><option value="active">فعالة</option><option value="inactive">معطلة</option></select><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">إلغاء</button><button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">حفظ</button></div></form>
      </div>
    </div>
  );
};
export default EditPlatformModal;