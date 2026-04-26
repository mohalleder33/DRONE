import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ConfirmDisableModal = ({ platform, onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96"><div className="flex items-center gap-2 text-yellow-600 mb-4"><ExclamationTriangleIcon className="h-8 w-8"/><h2 className="text-xl font-bold">تعطيل المنصة</h2></div><p>هل أنت متأكد من تعطيل منصة <strong>{platform.name}</strong>؟</p><p className="text-red-600 text-sm mt-2">سيتم إعادة جميع الكوادر والمعدات والذخائر إلى الرئاسة.</p><div className="flex justify-end gap-2 mt-4"><button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">إلغاء</button><button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded">تأكيد التعطيل</button></div></div>
  </div>
);
export default ConfirmDisableModal;