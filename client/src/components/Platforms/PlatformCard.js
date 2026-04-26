import React from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon, PencilIcon, TrashIcon, PowerIcon, DocumentDuplicateIcon, BellIcon, ChartBarIcon, TagIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const PlatformCard = ({ platform, onEdit, onDelete, onDisable, onEnable, onCopy, onNotify, onExport, onStatusChange, onAttendance }) => {
  const stats = platform.personnelStats || { power: 0, distribution: 0, present: 0 };
  const capacityPercent = platform.maxPersonnel ? (stats.power / platform.maxPersonnel) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition">
      {/* Header */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-white">{platform.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{platform.location}</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs ${platform.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
            {platform.status === 'active' ? 'فعالة' : 'معطلة'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
            <div className="text-xl font-bold text-blue-800 dark:text-blue-200">{stats.power}</div>
            <div className="text-xs">القوة</div>
          </div>
          <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded">
            <div className="text-xl font-bold text-yellow-800 dark:text-yellow-200">{stats.distribution}</div>
            <div className="text-xs">التوزيعات</div>
          </div>
          <div className="bg-green-100 dark:bg-green-900 p-2 rounded">
            <div className="text-xl font-bold text-green-800 dark:text-green-200">{stats.present}</div>
            <div className="text-xs">الموجود</div>
          </div>
        </div>

        {/* Capacity Bar */}
        {platform.maxPersonnel && (
          <div className="mb-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(capacityPercent, 100)}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">السعة: {stats.power}/{platform.maxPersonnel}</p>
          </div>
        )}
      </div>

      {/* Action Buttons - مرتبة بشكل جميل */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {/* الصف الأول: الأزرار الأساسية */}
        <div className="flex flex-wrap gap-2 justify-center mb-2">
          <Link to={`/platforms/${platform.id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition">
            <EyeIcon className="h-4 w-4" /> عرض التفاصيل
          </Link>
          {onEdit && (
            <button onClick={onEdit} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition">
              <PencilIcon className="h-4 w-4" /> تعديل
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition">
              <TrashIcon className="h-4 w-4" /> حذف
            </button>
          )}
          {platform.status === 'active' && onDisable && (
            <button onClick={onDisable} className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition">
              <PowerIcon className="h-4 w-4" /> تعطيل
            </button>
          )}
          {platform.status === 'inactive' && onEnable && (
            <button onClick={onEnable} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition">
              <PowerIcon className="h-4 w-4" /> تفعيل
            </button>
          )}
        </div>

        {/* الصف الثاني: أزرار إضافية (للمنصة) */}
        <div className="flex flex-wrap gap-2 justify-center pt-1 border-t border-gray-200 dark:border-gray-700">
          {onAttendance && (
            <button onClick={onAttendance} className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
              <UserGroupIcon className="h-3 w-3" /> الحضور
            </button>
          )}
          {onExport && (
            <>
              <button onClick={() => onExport('excel')} className="text-green-600 text-xs hover:underline">Excel</button>
              <button onClick={() => onExport('pdf')} className="text-red-600 text-xs hover:underline">PDF</button>
            </>
          )}
          {onStatusChange && (
            <button onClick={onStatusChange} className="text-yellow-600 text-xs flex items-center gap-1 hover:underline">
              <TagIcon className="h-3 w-3" /> الحالة
            </button>
          )}
          {onCopy && (
            <button onClick={onCopy} className="text-purple-600 text-xs flex items-center gap-1 hover:underline">
              <DocumentDuplicateIcon className="h-3 w-3" /> نسخ
            </button>
          )}
          {onNotify && (
            <button onClick={onNotify} className="text-indigo-600 text-xs flex items-center gap-1 hover:underline">
              <BellIcon className="h-3 w-3" /> إشعار
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformCard;