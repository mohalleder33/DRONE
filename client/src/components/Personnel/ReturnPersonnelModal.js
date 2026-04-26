import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { returnFromPlatform } from '../../services/personnelService';

const ReturnPersonnelModal = ({ personnel, type, platformId, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ تحديد معرف الكادر بشكل صحيح
  const personnelId = personnel?.id || personnel?._id;

  const handleReturn = async () => {
    if (!reason) {
      toast.error('يرجى إدخال سبب الإعادة');
      return;
    }
    
    if (!personnelId) {
      toast.error('خطأ: معرف الكادر غير موجود');
      console.error('Personnel object:', personnel);
      return;
    }

    console.log('Sending return data:', {
      type,
      id: personnelId,
      platformId,
      reason,
      details
    });

    setLoading(true);
    try {
      await returnFromPlatform(type, personnelId, platformId, reason, details);
      toast.success('تم إعادة الكادر بنجاح');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Return error:', error);
      toast.error(error.response?.data?.message || 'فشل إعادة الكادر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
        <h3 className="text-xl font-bold mb-4 text-yellow-600">إعادة {personnel?.name}</h3>
        
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-3 dark:bg-gray-700"
        >
          <option value="">اختر سبب الإعادة</option>
          <option value="انتهاء المأمورية">انتهاء المأمورية</option>
          <option value="نقل">نقل إلى منصة أخرى</option>
          <option value="عقاب">عقاب</option>
          <option value="إجازة">إجازة طويلة</option>
          <option value="أخرى">أخرى</option>
        </select>
        
        <textarea
          placeholder="تفاصيل إضافية (اختياري)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-4 dark:bg-gray-700"
          rows="3"
        />
        
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-md hover:bg-gray-400 transition"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleReturn}
            disabled={loading}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition disabled:opacity-50"
          >
            {loading ? 'جاري الإعادة...' : 'تأكيد الإعادة'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnPersonnelModal;