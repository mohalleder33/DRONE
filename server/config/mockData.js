const bcrypt = require('bcryptjs');

const initializeMockData = () => {
  // تعريف المستخدمين
  const users = [
    { id: '1', name: 'مدير النظام', username: 'admin', password: bcrypt.hashSync('admin123', 10), role: 'admin', email: 'admin@example.com', rank: 'عميد', militaryId: 'ADMIN01' },
    { id: '2', name: 'قائد', username: 'commander', password: bcrypt.hashSync('commander123', 10), role: 'commander', email: 'commander@example.com', rank: 'عقيد', militaryId: 'CMD01' }
  ];

  // تعريف الضباط
  let officers = [
    { id: 'off1', name: 'أحمد علي', rank: 'نقيب', militaryId: '12345', specialization: 'مشاة', unit: 'اللواء الأول', attendanceStatus: 'present', currentLocation: 'headquarters', rotationEndDate: null, type: 'officers' }
  ];

  // تعريف ضباط الصف
  let ncos = [
    { id: 'nco1', name: 'خالد محمود', rank: 'رقيب', militaryId: '67890', specialization: 'مدفعية', unit: 'اللواء الثاني', attendanceStatus: 'present', currentLocation: 'headquarters', rotationEndDate: null, type: 'ncos' }
  ];

  // تعريف المستنفرين
  let recruits = [
    { id: 'rec1', name: 'محمد حسن', rank: 'مستنفر', militaryId: '', specialization: '', unit: '', attendanceStatus: 'present', currentLocation: 'headquarters', rotationEndDate: null, type: 'recruits' }
  ];

  // تعريف المنصات
  let platforms = [
    { id: 'plat1', name: 'منصة الشمال', location: 'الشمال', status: 'active', maxPersonnel: 50, maxEquipment: 20, personnelStats: { power: 10, distribution: 2, present: 8 } }
  ];

  // تعريف المعدات
  let equipment = [];

  // تعريف الذخائر
  let ammunition = [
    { id: 'ammo1', name: 'ذخيرة عيار 7.62', caliber: '7.62', type: 'خارقة', total: 500, headquarters: 500, platforms: 0, minThreshold: 100, distribution: { headquarters: 500, platforms: {} } }
  ];

  // تعريف الدورات
  let courses = [];

  // تعريف الإعدادات
  let settings = {
    defaultTargetServiceDays: 30,
    alertThreshold: 7,
    criticalStockThreshold: 50,
    criticalEquipmentThreshold: 5,
    systemName: 'وحدة الطيران المسير'
  };

  // تعريف سجل العمليات
  let logs = [];

  // تعريف تفضيلات المستخدمين
  let userPreferences = {};

  // تعريف إعدادات التنبيهات
  let alertSettings = [
    { type: 'low_ammunition', name: 'مخزون ذخائر منخفض', description: 'عند وصول المخزون للحد الحرج', enabled: true, threshold: 100 },
    { type: 'rotation_end', name: 'نهاية مأمورية وشيكة', description: 'قبل انتهاء المأمورية بعدد أيام', enabled: true, threshold: 7 },
    { type: 'workshop_duration', name: 'مكث في الورشة', description: 'أيام مكث في الورشة', enabled: true, threshold: 14 }
  ];

  return {
    users,
    officers,
    ncos,
    recruits,
    platforms,
    equipment,
    ammunition,
    courses,
    settings,
    logs,
    userPreferences,
    alertSettings
  };
};

module.exports = { initializeMockData };