import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { createOfficer, createNCO, createRecruit } from '../../services/personnelService';
import { RANKS, ATTENDANCE_STATUS } from '../../constants/personnelConstants';

const AddPersonnelModal = ({ type, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    rank: '',
    militaryId: '',
    specialization: '',
    unit: '',
    attendanceStatus: 'present'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.rank) {
      toast.error('الاسم والرتبة مطلوبان');
      return;
    }
    setLoading(true);
    try {
      if (type === 'officers') {
        await createOfficer(formData);
      } else if (type === 'ncos') {
        await createNCO(formData);
      } else {
        await createRecruit(formData);
      }
      toast.success('تم إضافة الكادر بنجاح');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Add personnel error:', error);
      toast.error(error.response?.data?.message || 'فشل إضافة الكادر');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (type === 'officers') return 'إضافة ضابط جديد';
    if (type === 'ncos') return 'إضافة ضابط صف جديد';
    return 'إضافة مستنفر جديد';
  };

  const rankOptions = RANKS[type] || RANKS.recruits;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          {getTitle()}
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="الاسم الكامل *"
            value={formData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700 dark:text-white"
            required
          />
          
          <select
            name="rank"
            value={formData.rank}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="">اختر الرتبة</option>
            {rankOptions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          
          <input
            name="militaryId"
            placeholder={type === 'recruits' ? "الرقم العسكري (اختياري)" : "الرقم العسكري"}
            value={formData.militaryId}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700 dark:text-white"
          />
          
          <input
            name="specialization"
            placeholder="التخصص"
            value={formData.specialization}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700 dark:text-white"
          />
          
          <input
            name="unit"
            placeholder="الوحدة"
            value={formData.unit}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700 dark:text-white"
          />
          
          <select
            name="attendanceStatus"
            value={formData.attendanceStatus}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-4 dark:bg-gray-700 dark:text-white"
          >
            {ATTENDANCE_STATUS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          
          <div className="flex justify-end gap-2">
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

export default AddPersonnelModal;