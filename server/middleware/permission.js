// صلاحيات الوصول إلى الصفحات
const pagePermissions = {
  '/': ['admin', 'commander', 'platformCommander', 'viewer', 'workshop', 'trainingSupervisor'],
  '/headquarters': ['admin', 'commander'],
  '/platforms': ['admin', 'platformCommander', 'commander', 'viewer'],
  '/personnel': ['admin', 'commander', 'viewer'],
  '/equipment': ['admin', 'commander', 'workshop', 'viewer'],
  '/ammunition': ['admin', 'commander', 'viewer'],
  '/courses': ['admin', 'trainingSupervisor', 'viewer'],
  '/workshop': ['admin', 'workshop', 'commander'],
  '/reports': ['admin', 'commander', 'platformCommander', 'workshop', 'trainingSupervisor'],
  '/logs': ['admin', 'commander'],
  '/settings': ['admin'],
  '/profile': ['admin', 'commander', 'platformCommander', 'viewer', 'workshop', 'trainingSupervisor'],
  '/users': ['admin']
};

// دوال التحقق من صلاحية تنفيذ إجراء معين
const can = (user, action, resource = null) => {
  if (!user) return false;
  if (user.role === 'admin') return true;

  switch (action) {
    // صلاحيات المشاهدة
    case 'view':
      return ['admin', 'commander', 'platformCommander', 'viewer', 'workshop', 'trainingSupervisor'].includes(user.role);
    
    // صلاحيات الإنشاء
    case 'create':
      return ['admin', 'commander', 'trainingSupervisor'].includes(user.role);
    
    // صلاحيات التعديل
    case 'update':
      return ['admin', 'commander', 'platformCommander', 'workshop', 'trainingSupervisor'].includes(user.role);
    
    // صلاحيات الحذف
    case 'delete':
      return ['admin'].includes(user.role);
    
    // تعيين كادر من الرئاسة
    case 'assign_personnel':
      return user.role === 'admin' || user.role === 'commander';
    
    // إعادة كادر من منصة
    case 'return_personnel':
      if (user.role === 'admin') return true;
      if (user.role === 'platformCommander' && resource?.platformId === user.assignedPlatformId) return true;
      return false;
    
    // توزيع ذخيرة
    case 'distribute_ammunition':
      return user.role === 'admin' || user.role === 'commander';
    
    // إعدام ذخيرة
    case 'scrap_ammunition':
      if (user.role === 'admin') return true;
      if (user.role === 'commander') return true;
      if (user.role === 'platformCommander' && resource?.platformId === user.assignedPlatformId) return true;
      return false;
    
    // إرسال للورشة
    case 'send_to_workshop':
      return ['admin', 'commander', 'platformCommander', 'workshop'].includes(user.role);
    
    // إعادة من الورشة
    case 'return_from_workshop':
      return ['admin', 'workshop'].includes(user.role);
    
    // تغيير حالة الحضور
    case 'change_attendance':
      return ['admin', 'commander', 'platformCommander'].includes(user.role);
    
    // طباعة التقارير
    case 'print_report':
      return ['admin', 'commander', 'platformCommander', 'workshop', 'trainingSupervisor'].includes(user.role);
    
    // إرسال إشعارات
    case 'send_notification':
      return true; // الجميع يمكنه إرسال إشعارات
    
    // إدارة الدورات
    case 'manage_courses':
      return user.role === 'admin' || user.role === 'trainingSupervisor';
    
    default:
      return false;
  }
};

// التحقق من صلاحية الوصول إلى منصة معينة (لـ platformCommander)
const canAccessPlatform = (user, platformId) => {
  if (user.role === 'admin') return true;
  if (user.role === 'platformCommander') {
    return user.assignedPlatformId === platformId;
  }
  return false;
};

module.exports = { pagePermissions, can, canAccessPlatform };