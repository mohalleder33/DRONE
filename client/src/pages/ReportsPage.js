import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { can, ROLES } from '../utils/roleUtils';
import GeneralDailyReport from '../components/Reports/GeneralDailyReport';
import HeadquartersReport from '../components/Reports/HeadquartersReport';
import PlatformReport from '../components/Reports/PlatformReport';
import CourseReport from '../components/Reports/CourseReport';
import EquipmentReport from '../components/Reports/EquipmentReport';
import AmmunitionReport from '../components/Reports/AmmunitionReport';
import LogsReport from '../components/Reports/LogsReport';

const ReportsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');

  // ✅ صلاحيات المستخدم
  const canViewHeadquarters = can(user, 'view') && (user?.role === ROLES.ADMIN || user?.role === ROLES.COMMANDER);
  const canViewPlatforms = can(user, 'view') && (user?.role !== ROLES.WORKSHOP);
  const canViewCourses = can(user, 'view') && (user?.role !== ROLES.WORKSHOP);
  const canViewEquipment = can(user, 'view');
  const canViewAmmunition = can(user, 'view');
  const canViewLogs = user?.role === ROLES.ADMIN || user?.role === ROLES.COMMANDER;

  const tabs = [
    { id: 'general', name: 'اليومية العامة', show: true },
    { id: 'headquarters', name: 'الرئاسة', show: canViewHeadquarters },
    { id: 'platforms', name: 'المنصات', show: canViewPlatforms },
    { id: 'courses', name: 'الدورات التدريبية', show: canViewCourses },
    { id: 'equipment', name: 'المعدات', show: canViewEquipment },
    { id: 'ammunition', name: 'الذخائر', show: canViewAmmunition },
    { id: 'logs', name: 'سجل العمليات', show: canViewLogs }
  ];

  const visibleTabs = tabs.filter(tab => tab.show);

  // تعيين التبويب النشط إلى أول تبويب ظاهر إذا كان الحالي غير ظاهر
  if (!visibleTabs.find(tab => tab.id === activeTab)) {
    if (visibleTabs.length > 0) {
      setActiveTab(visibleTabs[0].id);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">التقارير</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex flex-wrap gap-2">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Report Content */}
      <div className="mt-4">
        {activeTab === 'general' && <GeneralDailyReport />}
        {activeTab === 'headquarters' && <HeadquartersReport />}
        {activeTab === 'platforms' && <PlatformReport />}
        {activeTab === 'courses' && <CourseReport />}
        {activeTab === 'equipment' && <EquipmentReport />}
        {activeTab === 'ammunition' && <AmmunitionReport />}
        {activeTab === 'logs' && <LogsReport />}
      </div>
    </div>
  );
};

export default ReportsPage;