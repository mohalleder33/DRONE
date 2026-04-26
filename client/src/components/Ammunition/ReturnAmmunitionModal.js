import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { returnAmmunition } from '../../services/ammunitionService';
import api from '../../services/api';

const ReturnAmmunitionModal = ({ ammunition, onClose, onSuccess }) => {
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatformId, setSelectedPlatformId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableOnPlatform, setAvailableOnPlatform] = useState(0);

  const ammoId = ammunition._id || ammunition.id;

  // جلب المنصات التي لديها توزيعات لهذه الذخيرة فقط
  useEffect(() => {
    const fetchPlatformsWithAmmo = async () => {
      try {
        // جلب جميع المنصات
        const res = await api.get('/platforms', { params: { limit: 100 } });
        const allPlatforms = res.data.data || [];
        
        // تصفية المنصات التي لديها توزيعات من هذه الذخيرة
        const platformsWithAmmo = allPlatforms.filter(p => {
          const quantity = ammunition.distribution?.platforms?.[p.id] || 
                          ammunition.distribution?.platforms?.[p._id] || 0;
          return quantity > 0;
        });
        
        setPlatforms(platformsWithAmmo);
      } catch (error) {
        console.error('Error fetching platforms:', error);
        toast.error('فشل تحميل المنصات');
      }
    };
    fetchPlatformsWithAmmo();
  }, [ammunition]);

  // تحديث الكمية المتاحة عند تغيير المنصة
  useEffect(() => {
    if (selectedPlatformId && ammunition.distribution?.platforms) {
      const qty = ammunition.distribution.platforms[selectedPlatformId] || 0;
      setAvailableOnPlatform(qty);
      // تحديث الكمية القصوى إلى المتاحة
      if (quantity > qty) setQuantity(qty);
    } else {
      setAvailableOnPlatform(0);
    }
  }, [selectedPlatformId, ammunition, quantity]);

  const handleSubmit = async () => {
    if (!selectedPlatformId) {
      toast.error('اختر المنصة');
      return;
    }
    if (quantity <= 0) {
      toast.error('كمية غير صالحة');
      return;
    }
    if (quantity > availableOnPlatform) {
      toast.error(`الكمية غير متوفرة على المنصة. المتاح: ${availableOnPlatform}`);
      return;
    }

    console.log('Sending return request:', { 
      id: ammoId, 
      platformId: selectedPlatformId, 
      quantity 
    });

    setLoading(true);
    try {
      await returnAmmunition(ammoId, selectedPlatformId, quantity);
      toast.success(`تم إعادة ${quantity} من ${ammunition.name} إلى المستودع`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Return error:', error);
      toast.error(error.response?.data?.message || 'فشل الإعادة');
    } finally {
      setLoading(false);
    }
  };

  if (platforms.length === 0 && !loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
          <h3 className="text-xl font-bold mb-4 text-yellow-600">لا توجد ذخائر للإعادة</h3>
          <p className="mb-4">لا توجد ذخائر من هذا الصنف موزعة على أي منصة</p>
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">إغلاق</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
        <h3 className="text-xl font-bold mb-4">إعادة {ammunition.name} من منصة</h3>
        
        <select
          value={selectedPlatformId}
          onChange={(e) => setSelectedPlatformId(e.target.value)}
          className="w-full border p-2 mb-2 rounded dark:bg-gray-700"
        >
          <option value="">اختر المنصة</option>
          {platforms.map(p => {
            const qty = ammunition.distribution?.platforms?.[p.id] || 
                       ammunition.distribution?.platforms?.[p._id] || 0;
            return (
              <option key={p.id} value={p.id}>
                {p.name} (متاح: {qty})
              </option>
            );
          })}
        </select>
        
        {selectedPlatformId && (
          <>
            <p className="text-sm text-gray-600 mb-2">الكمية المتاحة على المنصة: {availableOnPlatform}</p>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              min="1"
              max={availableOnPlatform}
              className="w-full border p-2 mb-4 rounded dark:bg-gray-700"
            />
          </>
        )}
        
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">إلغاء</button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || !selectedPlatformId || quantity <= 0 || quantity > availableOnPlatform} 
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'جاري الإعادة...' : 'إعادة'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnAmmunitionModal;