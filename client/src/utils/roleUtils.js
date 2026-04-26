export const ROLES = {
  ADMIN: 'admin',
  VIEWER: 'viewer',
  COMMANDER: 'commander',
  PLATFORM_COMMANDER: 'platformCommander',
  WORKSHOP: 'workshop',
  TRAINING_SUPERVISOR: 'trainingSupervisor'
};

// صلاحيات الوصول إلى الصفحات
export const pagePermissions = {
  '/': [ROLES.ADMIN, ROLES.COMMANDER, ROLES.PLATFORM_COMMANDER, ROLES.VIEWER, ROLES.WORKSHOP, ROLES.TRAINING_SUPERVISOR],
  '/headquarters': [ROLES.ADMIN, ROLES.COMMANDER],
  '/platforms': [ROLES.ADMIN, ROLES.PLATFORM_COMMANDER, ROLES.COMMANDER, ROLES.VIEWER],
  '/personnel': [ROLES.ADMIN, ROLES.COMMANDER, ROLES.VIEWER],
  '/equipment': [ROLES.ADMIN, ROLES.COMMANDER, ROLES.WORKSHOP, ROLES.VIEWER],
  '/ammunition': [ROLES.ADMIN, ROLES.COMMANDER, ROLES.VIEWER],
  '/courses': [ROLES.ADMIN, ROLES.TRAINING_SUPERVISOR, ROLES.VIEWER],
  '/workshop': [ROLES.ADMIN, ROLES.WORKSHOP, ROLES.COMMANDER],
  '/reports': [ROLES.ADMIN, ROLES.COMMANDER, ROLES.PLATFORM_COMMANDER, ROLES.WORKSHOP, ROLES.TRAINING_SUPERVISOR],
  '/logs': [ROLES.ADMIN, ROLES.COMMANDER],
  '/settings': [ROLES.ADMIN],
  '/profile': [ROLES.ADMIN, ROLES.COMMANDER, ROLES.PLATFORM_COMMANDER, ROLES.VIEWER, ROLES.WORKSHOP, ROLES.TRAINING_SUPERVISOR],
  '/users': [ROLES.ADMIN]
};

// التحقق من صلاحية الوصول إلى صفحة
export const canAccessPage = (user, path) => {
  if (!user) return false;
  const allowedRoles = pagePermissions[path];
  if (!allowedRoles) return false;
  return allowedRoles.includes(user.role);
};

// التحقق من صلاحية تنفيذ إجراء معين
export const can = (user, action, resource = null) => {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;

  switch (action) {
    case 'view':
      return [ROLES.ADMIN, ROLES.COMMANDER, ROLES.PLATFORM_COMMANDER, ROLES.VIEWER, ROLES.WORKSHOP, ROLES.TRAINING_SUPERVISOR].includes(user.role);
    case 'create':
      return [ROLES.ADMIN, ROLES.COMMANDER, ROLES.TRAINING_SUPERVISOR].includes(user.role);
    case 'update':
      return [ROLES.ADMIN, ROLES.COMMANDER, ROLES.PLATFORM_COMMANDER, ROLES.WORKSHOP, ROLES.TRAINING_SUPERVISOR].includes(user.role);
    case 'delete':
      return [ROLES.ADMIN].includes(user.role);
    case 'assign_personnel':
      return user.role === ROLES.ADMIN || user.role === ROLES.COMMANDER;
    case 'return_personnel':
      if (user.role === ROLES.ADMIN) return true;
      if (user.role === ROLES.PLATFORM_COMMANDER && resource?.platformId === user.assignedPlatformId) return true;
      return false;
    case 'distribute_ammunition':
      return user.role === ROLES.ADMIN || user.role === ROLES.COMMANDER;
    case 'scrap_ammunition':
      if (user.role === ROLES.ADMIN) return true;
      if (user.role === ROLES.COMMANDER) return true;
      if (user.role === ROLES.PLATFORM_COMMANDER && resource?.platformId === user.assignedPlatformId) return true;
      return false;
    case 'send_to_workshop':
      return [ROLES.ADMIN, ROLES.COMMANDER, ROLES.PLATFORM_COMMANDER, ROLES.WORKSHOP].includes(user.role);
    case 'return_from_workshop':
      return [ROLES.ADMIN, ROLES.WORKSHOP].includes(user.role);
    case 'change_attendance':
      return [ROLES.ADMIN, ROLES.COMMANDER, ROLES.PLATFORM_COMMANDER].includes(user.role);
    case 'print_report':
      return [ROLES.ADMIN, ROLES.COMMANDER, ROLES.PLATFORM_COMMANDER, ROLES.WORKSHOP, ROLES.TRAINING_SUPERVISOR].includes(user.role);
    case 'send_notification':
      return true;
    case 'manage_courses':
      return user.role === ROLES.ADMIN || user.role === ROLES.TRAINING_SUPERVISOR;
    default:
      return false;
  }
};

// فلترة المنصات حسب صلاحية المستخدم (لـ platformCommander)
export const filterPlatforms = (user, platforms) => {
  if (!user) return [];
  if (user.role === ROLES.ADMIN) return platforms;
  if (user.role === ROLES.PLATFORM_COMMANDER) {
    return platforms.filter(p => p.id === user.assignedPlatformId || p._id === user.assignedPlatformId);
  }
  return platforms;
};

// الحصول على اسم الدور بالعربية
export const getRoleLabel = (role) => {
  const labels = {
    [ROLES.ADMIN]: 'مدير النظام',
    [ROLES.VIEWER]: 'مشاهد',
    [ROLES.COMMANDER]: 'قائد الرئاسة',
    [ROLES.PLATFORM_COMMANDER]: 'قائد منصة',
    [ROLES.WORKSHOP]: 'مسؤول الورشة',
    [ROLES.TRAINING_SUPERVISOR]: 'مشرف التدريب'
  };
  return labels[role] || role;
};

// ✅ التحقق من صلاحية الوصول إلى منصة معينة (لـ platformCommander)
export const canAccessPlatform = (user, platformId) => {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.PLATFORM_COMMANDER) {
    return user.assignedPlatformId === platformId;
  }
  return false;
};