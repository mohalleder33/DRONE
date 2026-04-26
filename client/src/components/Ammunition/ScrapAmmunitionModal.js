import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { scrapAmmunition } from '../../services/ammunitionService';
import { LOCATION_TYPES } from '../../constants/ammunitionConstants';

const ScrapAmmunitionModal = ({ ammunition, onClose, onSuccess }) => {
  const [locationType, setLocationType] = useState('headquarters');
  const [locationId, setLocationId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  
  const ammoId = ammunition._id || ammunition.id;
  const maxQuantity = locationType === 'headquarters' ? (ammunition.headquarters || 0) : (ammunition.platforms || 0);

  const handleSubmit = async () => {
    if (quantity <= 0 || quantity > maxQuantity) {
      toast.error(`الكمية غير صالحة. المتاح: ${maxQuantity}`);
      return;
    }
    if (!reason.trim()) {
      toast.error('يرجى إدخال سبب الإعدام');
      return;
    }
    setLoading(true);
    try {
      await scrapAmmunition(ammoId, locationType, locationType === 'headquarters' ? null : locationId, quantity, reason);
      toast.success('تم إعدام الكمية المحددة');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Scrap error:', error);
      toast.error(error.response?.data?.message || 'فشل الإعدام');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
        <h3 className="text-xl font-bold mb-4 text-red-600">إعدام {ammunition.name}</h3>
        <select
          value={locationType}
          onChange={(e) => setLocationType(e.target.value)}
          className="w-full border p-2 mb-2 rounded dark:bg-gray-700"
        >
          {LOCATION_TYPES.map(lt => (
            <option key={lt.value} value={lt.value}>{lt.label}</option>
          ))}
        </select>
        {locationType === 'platform' && (
          <input
            type="text"
            placeholder="معرف المنصة (ID)"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="w-full border p-2 mb-2 rounded dark:bg-gray-700"
            required
          />
        )}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">المتاح للإعدام: {maxQuantity}</p>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          min="1"
          max={maxQuantity}
          className="w-full border p-2 mb-2 rounded dark:bg-gray-700"
        />
        <textarea
          placeholder="سبب الإعدام"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border p-2 mb-4 rounded dark:bg-gray-700"
          rows="2"
          required
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">إلغاء</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded">إعدام</button>
        </div>
      </div>
    </div>
  );
};

export default ScrapAmmunitionModal;