import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { addToWarehouse, getAmmunition } from '../../services/ammunitionService';

const BulkAddAmmunitionModal = ({ onClose, onSuccess }) => {
  const [ammunitionList, setAmmunitionList] = useState([]);
  const [selectedAmmoId, setSelectedAmmoId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // جلب قائمة الأصناف عند فتح المودال
  useEffect(() => {
    const fetchAmmunition = async () => {
      setFetching(true);
      try {
        const res = await getAmmunition(1, 100); // جلب جميع الأصناف
        setAmmunitionList(res.data.data);
      } catch (error) {
        console.error('Error fetching ammunition:', error);
        toast.error('فشل تحميل قائمة الذخائر');
      } finally {
        setFetching(false);
      }
    };
    fetchAmmunition();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAmmoId) {
      toast.error('يرجى اختيار الصنف');
      return;
    }
    if (quantity < 1) {
      toast.error('الكمية غير صالحة');
      return;
    }
    setLoading(true);
    try {
      await addToWarehouse(selectedAmmoId, quantity);
      toast.success('تم توريد الذخيرة بنجاح');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Add to warehouse error:', error);
      toast.error(error.response?.data?.message || 'فشل التوريد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">توريد ذخيرة إلى المستودع</h3>
        <form onSubmit={handleSubmit}>
          {fetching ? (
            <div className="text-center py-4">جاري تحميل الأصناف...</div>
          ) : (
            <select
              value={selectedAmmoId}
              onChange={(e) => setSelectedAmmoId(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-3 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">اختر الصنف</option>
              {ammunitionList.map(ammo => (
                <option key={ammo._id || ammo.id} value={ammo._id || ammo.id}>
                  {ammo.name} - {ammo.caliber} ({ammo.type})
                </option>
              ))}
            </select>
          )}
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            min="1"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-4 dark:bg-gray-700 dark:text-white"
            required
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
              type="submit"
              disabled={loading || fetching}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'جاري التوريد...' : 'توريد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkAddAmmunitionModal;