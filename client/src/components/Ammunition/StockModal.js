import React, { useState, useEffect } from 'react';
import { getAmmunitionStock } from '../../services/ammunitionService';
import api from '../../services/api';
import toast from 'react-hot-toast';

const StockModal = ({ ammunition, onClose }) => {
  const [stock, setStock] = useState(null);
  const [platformsMap, setPlatformsMap] = useState({});
  const [loading, setLoading] = useState(false);

  // جلب جميع المنصات للحصول على الأسماء
  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const res = await api.get('/platforms', { params: { limit: 100 } });
        const map = {};
        (res.data.data || []).forEach(p => {
          map[p.id] = p.name;
          map[p._id] = p.name;
        });
        setPlatformsMap(map);
      } catch (error) {
        console.error('Error fetching platforms:', error);
      }
    };
    fetchPlatforms();
  }, []);

  useEffect(() => {
    const fetchStock = async () => {
      setLoading(true);
      try {
        const res = await getAmmunitionStock(ammunition.id);
        console.log('Stock data:', res.data);
        setStock(res.data);
      } catch (error) {
        console.error('Error fetching stock:', error);
        toast.error('فشل تحميل تفاصيل المخزون');
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, [ammunition.id]);

  // تحويل platforms إلى مصفوفة مع أسماء المنصات
  const getPlatformsList = () => {
    if (!stock?.platforms) return [];
    
    // إذا كان platforms مصفوفة
    if (Array.isArray(stock.platforms)) {
      return stock.platforms.map(p => ({
        ...p,
        name: platformsMap[p.id] || platformsMap[p._id] || p.id
      }));
    }
    
    // إذا كان platforms كائن (Object)
    if (typeof stock.platforms === 'object') {
      return Object.entries(stock.platforms).map(([id, quantity]) => ({
        id,
        name: platformsMap[id] || id,
        quantity
      }));
    }
    
    return [];
  };

  const platformsList = getPlatformsList();
  const hasPlatforms = platformsList.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">تفاصيل توزيع {ammunition.name}</h3>
        
        {loading ? (
          <div className="text-center">جاري التحميل...</div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded">
              <h4 className="font-semibold">المستودع الرئيسي</h4>
              <p>الكمية: {stock?.headquarters || 0}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">المنصات</h4>
              {!hasPlatforms ? (
                <p className="text-gray-500">لا توجد كمية على منصات</p>
              ) : (
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="p-2 text-right">المنصة</th>
                      <th className="p-2 text-right">الكمية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformsList.map((p, idx) => (
                      <tr key={idx} className="border-t dark:border-gray-700">
                        <td className="p-2">{p.name}</td>
                        <td className="p-2">{p.quantity}</td>
                       </tr>
                    ))}
                  </tbody>
                 </table>
              )}
            </div>
          </div>
        )}
        
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 transition">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockModal;