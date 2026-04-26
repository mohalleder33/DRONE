import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, PencilIcon } from '@heroicons/react/24/outline';

const WorkshopEquipmentCard = ({ group, userRole, onReturn, onRetire, onEditFault, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const canReturn = ['admin', 'commander', 'officer'].includes(userRole);
  const canRetire = userRole === 'admin';
  const canEditFault = ['admin', 'commander'].includes(userRole);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border">
      <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-between">
        <div>
          <h3 className="font-bold">{group.name}</h3>
          <p className="text-sm">موديل: {group.model}</p>
          <p className="text-sm">النوع: {group.type}</p>
        </div>
        <div>
          <span className="bg-yellow-100 px-2 py-1 rounded text-sm">{group.total} قطعة</span>
          <button onClick={() => setExpanded(!expanded)} className="mr-2">
            {expanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="divide-y">
          {group.items.map(item => (
            <div key={item._id || item.id} className="p-3">
              <div className="flex justify-between">
                <div>
                  <div className="font-mono text-sm">الرقم التسلسلي: {item.serialNumber}</div>
                  <div className="text-xs text-gray-500">تاريخ الاستلام: {new Date(item.receivedDate).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500">المنصة المصدر: {item.fromPlatform || 'غير معروف'}</div>
                  <div className="text-xs mt-1">العطل: {item.faultDescription}</div>
                </div>
                <div className="flex gap-2">
                  {canReturn && (
                    <button onClick={() => onReturn(item)} className="text-green-600" title="إعادة">↩️</button>
                  )}
                  {canRetire && (
                    <button onClick={() => onRetire(item)} className="text-red-600" title="إخراج">🗑️</button>
                  )}
                  {canEditFault && (
                    <button onClick={() => onEditFault(item)} className="text-blue-600" title="تعديل العطل">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkshopEquipmentCard;