import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import DistributeAmmunitionModal from './DistributeAmmunitionModal';
import ReturnAmmunitionModal from './ReturnAmmunitionModal';
import UpdateThresholdModal from './UpdateThresholdModal';
import ScrapAmmunitionModal from './ScrapAmmunitionModal';
import StockModal from './StockModal';

const AmmunitionCards = ({ ammunition, loading, platforms, onRefresh, userRole }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [modal, setModal] = useState({ type: null, data: null });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) return <div className="text-center py-10">جاري التحميل...</div>;
  if (!ammunition.length) return <div className="text-center py-10 text-gray-500">لا توجد ذخائر</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ammunition.map((item) => {
        // ✅ الحصول على المعرف الصحيح (يدعم MongoDB _id و mock id)
        const itemId = item._id || item.id;
        
        return (
          <div
            key={itemId}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border ${
              item.total <= item.minThreshold ? 'border-red-500 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {/* Card Header */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">العيار: {item.caliber}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">النوع: {item.type}</p>
              </div>
              <div className="text-left">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{item.total}</div>
                <div className="text-xs text-gray-500">الإجمالي</div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="p-3 grid grid-cols-2 gap-2 text-center text-sm border-b">
              <div>
                <span className="font-semibold">{item.headquarters || 0}</span>
                <div className="text-xs text-gray-500">المستودع</div>
              </div>
              <div>
                <span className="font-semibold">{item.platforms || 0}</span>
                <div className="text-xs text-gray-500">المنصات</div>
              </div>
            </div>

            {/* Expand Button */}
            <button
              onClick={() => toggleExpand(itemId)}
              className="w-full p-2 text-center text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-center items-center gap-1"
            >
              {expandedId === itemId ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              {expandedId === itemId ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
            </button>

            {/* Expanded Details */}
            {expandedId === itemId && (
              <div className="p-4 border-t bg-gray-50 dark:bg-gray-900 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>الحد الأدنى:</span>
                  <span className={item.total <= item.minThreshold ? 'text-red-600 font-bold' : ''}>{item.minThreshold}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>الكمية في المستودع:</span>
                  <span>{item.headquarters || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>الكمية في المنصات:</span>
                  <span>{item.platforms || 0}</span>
                </div>
                <div className="pt-2 flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => setModal({ type: 'distribute', data: { ...item, id: itemId } })}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition"
                  >
                    📤 توزيع
                  </button>
                  <button
                    onClick={() => setModal({ type: 'return', data: { ...item, id: itemId } })}
                    className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200 transition"
                  >
                    ↩️ إعادة
                  </button>
                  <button
                    onClick={() => setModal({ type: 'threshold', data: { ...item, id: itemId } })}
                    className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-sm hover:bg-yellow-200 transition"
                  >
                    ⚙️ تعديل الحد
                  </button>
                  {(userRole === 'admin' || userRole === 'commander') && (
                    <button
                      onClick={() => setModal({ type: 'scrap', data: { ...item, id: itemId } })}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition"
                    >
                      🗑️ إعدام
                    </button>
                  )}
                  <button
                    onClick={() => setModal({ type: 'stock', data: { ...item, id: itemId } })}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 transition"
                  >
                    👁️ تفاصيل التوزيع
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Modals */}
      {modal.type === 'distribute' && (
        <DistributeAmmunitionModal
          ammunition={modal.data}
          platforms={platforms}
          onClose={() => setModal({ type: null })}
          onSuccess={onRefresh}
        />
      )}
      {modal.type === 'return' && (
        <ReturnAmmunitionModal
          ammunition={modal.data}
          platforms={platforms}
          onClose={() => setModal({ type: null })}
          onSuccess={onRefresh}
        />
      )}
      {modal.type === 'threshold' && (
        <UpdateThresholdModal
          ammunition={modal.data}
          onClose={() => setModal({ type: null })}
          onSuccess={onRefresh}
        />
      )}
      {modal.type === 'scrap' && (
        <ScrapAmmunitionModal
          ammunition={modal.data}
          onClose={() => setModal({ type: null })}
          onSuccess={onRefresh}
        />
      )}
      {modal.type === 'stock' && (
        <StockModal
          ammunition={modal.data}
          onClose={() => setModal({ type: null })}
        />
      )}
    </div>
  );
};

export default AmmunitionCards;