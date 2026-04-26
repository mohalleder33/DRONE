// ثوابت أنواع التقارير
export const REPORT_TYPES = {
  GENERAL_DAILY: 'generalDaily',
  HEADQUARTERS: 'headquarters',
  PLATFORM: 'platform',
  COURSE: 'course',
  EQUIPMENT: 'equipment',
  AMMUNITION: 'ammunition',
  LOGS: 'logs'
};

// ثوابت المواقع للفلترة
export const LOCATIONS = {
  HEADQUARTERS: 'headquarters',
  PLATFORM: 'platform',
  GENERAL: 'general',
  COURSE: 'course'
};

// ثوابت حالة الكوادر
export const ATTENDANCE_CATEGORIES = {
  PRESENT: 'present',
  DISTRIBUTED: 'distributed',
  STUDENT: 'student',
  ABSENT: 'absent',
  LEAVE: 'leave',
  SICK: 'sick',
  OTHER: 'other'
};

// ألوان فئات الحضور للعرض
export const ATTENDANCE_COLORS = {
  present: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  distributed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  student: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  absent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  leave: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  sick: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
};