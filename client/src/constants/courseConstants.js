export const COURSE_STATUS = [
  { value: 'قادمة', label: 'قادمة', color: 'blue' },
  { value: 'جارية', label: 'جارية', color: 'green' },
  { value: 'منتهية', label: 'منتهية', color: 'gray' },
  { value: 'ملغاة', label: 'ملغاة', color: 'red' }
];
export const courseStatusColors = {
  قادمة: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  جارية: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  منتهية: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  ملغاة: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};
export const ATTENDANCE_OPTIONS = [
  { value: 'حاضر', label: 'حاضر', color: 'green' },
  { value: 'غائب', label: 'غائب', color: 'red' },
  { value: 'بعذر', label: 'بعذر', color: 'yellow' }
];
export const getCourseStatusColor = (status) => courseStatusColors[status] || courseStatusColors.قادمة;