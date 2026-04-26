import React, { useState } from 'react';
import * as equipmentService from '../../services/equipmentService';
import toast from 'react-hot-toast';

const RetireEquipmentModal = ({ equipment, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ التحقق من وجود equipment قبل المحاولة
  if (!equipment || !equipment.id) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
          <h2 className="text-xl font-bold mb-4 text-red-600">خطأ</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">بيانات المعدة غير مكتملة</p>
          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded-lg">إغلاق</button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('الرجاء إدخال سبب إخراج المعدة من الخدمة');
      return;
    }
    setLoading(true);
    try {
      await equipmentService.retireEquipment(equipment.id, reason);
      toast.success('تم إخراج المعدة من الخدمة بنجاح');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error retiring equipment:', error);
      toast.error(error.response?.data?.message || 'فشل إخراج المعدة من الخدمة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          إخراج المعدة من الخدمة
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          المعدة: <span className="font-semibold">{equipment.name}</span>
        </p>
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="سبب الإخراج من الخدمة (مثال: تالفة، منتهية الصلاحية، ...)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4"
            rows="3"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? 'جاري الإخراج...' : 'تأكيد الإخراج'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RetireEquipmentModal;