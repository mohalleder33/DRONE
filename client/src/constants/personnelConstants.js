export const PERSONNEL_TYPES = {
  OFFICERS: 'officers',
  NCOS: 'ncos',
  RECRUITS: 'recruits'
};

export const ATTENDANCE_STATUS = [
  { value: 'present', label: 'حاضر', color: 'green' },
  { value: 'leave', label: 'إذن', color: 'yellow' },
  { value: 'sick', label: 'علاج', color: 'blue' },
  { value: 'absent', label: 'غياب', color: 'red' },
  { value: 'absent_unauthorized', label: 'هروب', color: 'red' },
  { value: 'prison', label: 'سجن', color: 'red' },
  { value: 'student', label: 'دارس', color: 'purple' },
  { value: 'other', label: 'أخرى', color: 'gray' }
];

export const attendanceStatusColors = {
  present: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  leave: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  sick: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  absent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  absent_unauthorized: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  prison: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  student: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
};

export const getStatusColor = (status) => attendanceStatusColors[status] || attendanceStatusColors.other;

export const RANKS = {
  officers: ['عميد', 'عقيد', 'مقدم', 'رائد', 'نقيب', 'ملازم أول', 'ملازم'],
  ncos: ['مساعد ', 'رقيب أول', 'رقيب', 'عريف', 'وكيل عريف', 'جندي'],
  recruits: ['مستنفر']
};