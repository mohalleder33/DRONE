import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { bulkAddEquipment } from '../../services/equipmentService';
import { EQUIPMENT_TYPES } from '../../constants/equipmentConstants';

const BulkAddEquipmentModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: '',
    model: '',
    type: 'قتالية',
    count: 1,
    serialPrefix: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.model || !form.count || !form.serialPrefix) {
      toast.error('يرجى إكمال جميع الحقول المطلوبة');
      return;
    }
    setLoading(true);
    try {
      await bulkAddEquipment(form);
      toast.success(`تم إضافة ${form.count} قطعة بنجاح`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل إضافة المعدات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">إضافة معدات متعددة</h2>
        <form onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="الاسم *"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700 dark:text-white"
            required
          />
          <input
            name="model"
            placeholder="الموديل *"
            value={form.model}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700 dark:text-white"
            required
          />
          
          {/* ✅ حقل النوع مع الخيارات الجديدة */}
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700 dark:text-white"
            required
          >
            {EQUIPMENT_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <input
            name="count"
            type="number"
            placeholder="العدد *"
            value={form.count}
            onChange={handleChange}
            min="1"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700 dark:text-white"
            required
          />
          <input
            name="serialPrefix"
            placeholder="بادئة الرقم التسلسلي (مثال: DRONE-)*"
            value={form.serialPrefix}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700 dark:text-white"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            سيتم إنشاء أرقام تسلسلية تلقائياً: {form.serialPrefix}1, {form.serialPrefix}2, ...
          </p>
          
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-md hover:bg-gray-400 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'جاري الإضافة...' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkAddEquipmentModal;