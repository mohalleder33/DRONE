import React, { useState, useEffect } from 'react';
import { TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';
import ScrapAmmunitionModal from '../Ammunition/ScrapAmmunitionModal';
import ReturnAmmunitionModal from '../Ammunition/ReturnAmmunitionModal';

const AmmunitionTab = ({ platformId, onRefresh }) => {
  const [ammunition, setAmmunition] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scrapModal, setScrapModal] = useState(null);
  const [returnModal, setReturnModal] = useState(null);

  const fetchAmmunition = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/platforms/${platformId}/ammunition`);
      console.log('🔫 Ammunition response:', res.data);
      setAmmunition(res.data);
    } catch (error) {
      console.error('Error fetching ammunition:', error);
      toast.error('فشل تحميل الذخائر');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmmunition();
  }, [platformId]);

  if (loading) return <div className="text-center py-4">جاري تحميل الذخائر...</div>;

  if (ammunition.length === 0) {
    return <div className="text-center py-4 text-gray-500">لا توجد ذخائر على هذه المنصة</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={fetchAmmunition} className="text-blue-600 hover:text-blue-800">
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="p-3 text-right">الاسم</th>
              <th className="p-3 text-right">العيار</th>
              <th className="p-3 text-right">النوع</th>
              <th className="p-3 text-right">الكمية</th>
              <th className="p-3 text-right">الحد الأدنى</th>
              <th className="p-3 text-right">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {ammunition.map(ammo => (
              <tr key={ammo.id} className={`border-t dark:border-gray-700 ${ammo.quantity <= ammo.minThreshold ? 'bg-red-50 dark:bg-red-900/30' : ''}`}>
                <td className="p-3">{ammo.name}</td>
                <td className="p-3">{ammo.caliber}</td>
                <td className="p-3">{ammo.type}</td>
                <td className="p-3 font-semibold">{ammo.quantity}</td>
                <td className="p-3">{ammo.minThreshold}</td>
                <td className="p-3">
                  <button onClick={() => setReturnModal(ammo)} className="text-green-600 hover:text-green-800 ml-2" title="إعادة منصة">
                    ↩️
                  </button>
                  <button onClick={() => setScrapModal(ammo)} className="text-red-600 hover:text-red-800" title="إعدام">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {scrapModal && (
        <ScrapAmmunitionModal
          ammunition={scrapModal}
          locationType="platform"
          locationId={platformId}
          onClose={() => setScrapModal(null)}
          onSuccess={() => {
            fetchAmmunition();
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {returnModal && (
        <ReturnAmmunitionModal
          ammunition={returnModal}
          onClose={() => setReturnModal(null)}
          onSuccess={() => {
            fetchAmmunition();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default AmmunitionTab;