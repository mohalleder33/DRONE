import React, { useState } from 'react';
import * as personnelRotationService from '../../services/personnelRotationService';
import toast from 'react-hot-toast';

const EditRotationModal = ({ personnel, type, onClose, onSuccess }) => {
  const [endDate, setEndDate] = useState(
    personnel?.rotationEndDate ? personnel.rotationEndDate.split('T')[0] : ''
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!endDate) {
      toast.error('الرجاء إدخال تاريخ الانتهاء الجديد');
      return;
    }
    setLoading(true);
    try {
      await personnelRotationService.updateRotationEndDate(type, personnel._id, endDate);
      toast.success('تم تحديث تاريخ الانتهاء بنجاح');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل تحديث التاريخ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          تعديل تاريخ انتهاء المأمورية لـ {personnel?.fullName}
        </h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            تاريخ الانتهاء الجديد
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRotationModal;