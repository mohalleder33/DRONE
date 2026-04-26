import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccessPage } from '../../utils/roleUtils';
import {
  HomeIcon,
  UserGroupIcon,
  CubeIcon,
  ShieldExclamationIcon,
  BookOpenIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'لوحة التحكم', href: '/', icon: HomeIcon },
  { name: 'الرئاسة', href: '/headquarters', icon: BuildingOfficeIcon },
  { name: 'المنصات', href: '/platforms', icon: HomeIcon },
  { name: 'الكوادر', href: '/personnel', icon: UserGroupIcon },
  { name: 'المعدات', href: '/equipment', icon: CubeIcon },
  { name: 'الذخائر', href: '/ammunition', icon: ShieldExclamationIcon },
  { name: 'الدورات', href: '/courses', icon: BookOpenIcon },
  { name: 'الورشة', href: '/workshop', icon: WrenchScrewdriverIcon },
  { name: 'التقارير', href: '/reports', icon: ChartBarIcon },
  { name: 'سجل التدقيق', href: '/logs', icon: DocumentTextIcon },
  { name: 'الإعدادات', href: '/settings', icon: Cog6ToothIcon },
  { name: 'المستخدمين', href: '/users', icon: UsersIcon }
];

const Sidebar = () => {
  const { user } = useAuth();

  const filteredNavigation = navigation.filter(item => {
    if (item.href === '/users' && user?.role !== 'admin') return false;
    return canAccessPage(user, item.href);
  });

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <span className="text-xl font-bold text-gray-800 dark:text-white">وحدة الطيران المسير</span>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`
              }
            >
              <item.icon className="ml-3 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;