import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { assignToPlatform } from '../../services/personnelService';
import api from '../../services/api';

const AssignPersonnelModal = ({ personnel, type, onClose, onSuccess }) => {
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatformId, setSelectedPlatformId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const res = await api.get('/platforms', { params: { limit: 100, status: 'active' } });
        setPlatforms(res.data.data);
      } catch (error) {
        console.error('Error fetching platforms:', error);
        toast.error('فشل تحميل المنصات');
      }
    };
    fetchPlatforms();
  }, []);

  // ✅ التحقق من وجود personnel قبل استخدامه
  if (!personnel) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
          <h3 className="text-xl font-bold mb-4 text-red-600">خطأ</h3>
          <p>بيانات الكادر غير متوفرة</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-300 rounded">إغلاق</button>
        </div>
      </div>
    );
  }

  const personnelId = personnel._id || personnel.id;

  const handleAssign = async () => {
    if (!selectedPlatformId) {
      toast.error('يرجى اختيار المنصة');
      return;
    }
    if (!startDate) {
      toast.error('يرجى اختيار تاريخ البدء');
      return;
    }
    if (!endDate) {
      toast.error('يرجى اختيار تاريخ الانتهاء');
      return;
    }

    setLoading(true);
    try {
      await assignToPlatform(type, personnelId, selectedPlatformId, startDate, endDate);
      toast.success('تم تعيين الكادر بنجاح');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error(error.response?.data?.message || 'فشل التعيين');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
        <h3 className="text-xl font-bold mb-4">تعيين {personnel.name}</h3>
        
        <select
          value={selectedPlatformId}
          onChange={(e) => setSelectedPlatformId(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-3 dark:bg-gray-700"
        >
          <option value="">اختر المنصة</option>
          {platforms.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-3 dark:bg-gray-700"
          placeholder="تاريخ البدء"
        />
        
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-4 dark:bg-gray-700"
          placeholder="تاريخ الانتهاء"
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
            onClick={handleAssign}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'جاري التعيين...' : 'تعيين'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignPersonnelModal;