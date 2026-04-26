import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { updateMinThreshold } from '../../services/ammunitionService';

const UpdateThresholdModal = ({ ammunition, onClose, onSuccess }) => {
  const [newThreshold, setNewThreshold] = useState(ammunition.minThreshold || 0);
  const [loading, setLoading] = useState(false);
  
  const ammoId = ammunition._id || ammunition.id;

  const handleSubmit = async () => {
    if (newThreshold < 0) {
      toast.error('قيمة غير صالحة');
      return;
    }
    setLoading(true);
    try {
      await updateMinThreshold(ammoId, newThreshold);
      toast.success('تم تحديث الحد الأدنى');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Update threshold error:', error);
      toast.error(error.response?.data?.message || 'فشل التحديث');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
        <h3 className="text-xl font-bold mb-4">تعديل الحد الأدنى لـ {ammunition.name}</h3>
        <p className="mb-2">الحد الحالي: {ammunition.minThreshold}</p>
        <input
          type="number"
          value={newThreshold}
          onChange={(e) => setNewThreshold(parseInt(e.target.value))}
          className="w-full border p-2 mb-4 rounded dark:bg-gray-700"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">إلغاء</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-yellow-600 text-white rounded">حفظ</button>
        </div>
      </div>
    </div>
  );
};

export default UpdateThresholdModal;