import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { distributeAmmunition } from '../../services/ammunitionService';

const DistributeAmmunitionModal = ({ ammunition, platforms, onClose, onSuccess }) => {
  const [selectedPlatformId, setSelectedPlatformId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const maxAvail = ammunition.headquarters || 0;
  const ammoId = ammunition._id || ammunition.id;

  const handleSubmit = async () => {
    if (!selectedPlatformId) {
      toast.error('اختر المنصة');
      return;
    }
    if (quantity <= 0 || quantity > maxAvail) {
      toast.error(`الكمية غير صالحة. المتاح: ${maxAvail}`);
      return;
    }
    setLoading(true);
    try {
      await distributeAmmunition(ammoId, selectedPlatformId, quantity);
      toast.success(`تم توزيع ${quantity} إلى المنصة`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Distribute error:', error);
      toast.error(error.response?.data?.message || 'فشل التوزيع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
        <h3 className="text-xl font-bold mb-4">توزيع {ammunition.name}</h3>
        <p className="mb-2">المتاح في المستودع: {maxAvail}</p>
        <select
          value={selectedPlatformId}
          onChange={(e) => setSelectedPlatformId(e.target.value)}
          className="w-full border p-2 mb-2 rounded dark:bg-gray-700"
        >
          <option value="">اختر المنصة</option>
          {platforms.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          min="1"
          max={maxAvail}
          className="w-full border p-2 mb-4 rounded dark:bg-gray-700"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">إلغاء</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">توزيع</button>
        </div>
      </div>
    </div>
  );
};

export default DistributeAmmunitionModal;