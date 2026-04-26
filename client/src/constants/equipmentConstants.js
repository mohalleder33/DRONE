export const EQUIPMENT_STATUS = [
  { value: 'جاهزة', label: 'جاهزة', color: 'green' },
  { value: 'موزعة', label: 'موزعة', color: 'blue' },
  { value: 'في الصيانة', label: 'في الصيانة', color: 'yellow' },
  { value: 'خارج الخدمة', label: 'خارج الخدمة', color: 'red' }
];

export const equipmentStatusColors = {
  جاهزة: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  موزعة: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'في الصيانة': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'خارج الخدمة': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

// ✅ تحديث أنواع المعدات
export const EQUIPMENT_TYPES = [
  'قتالية',
  'استطلاعية',
  'انتحارية',
  'تدريبية'
];

export const getEquipmentStatusColor = (status) => equipmentStatusColors[status] || equipmentStatusColors.جاهزة;