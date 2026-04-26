import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bars3Icon, UserCircleIcon, SunIcon, MoonIcon, Cog6ToothIcon, UsersIcon } from '@heroicons/react/24/outline';
import NotificationBell from '../Notifications/NotificationBell';
import { ROLES } from '../../utils/roleUtils';

const Header = ({ setMobileSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const dropdownRef = useRef();
  const settingsDropdownRef = useRef();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(e.target)) {
        setSettingsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = user?.role === ROLES.ADMIN;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden text-gray-500 dark:text-gray-400">
          <Bars3Icon className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-3">
          <img 
            src="/assets/logo.png" 
            alt="شعار النظام" 
            className="h-10 w-10 object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span className="text-lg font-bold text-gray-800 dark:text-white hidden sm:block">
            وحدة الطيران المسير
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setDarkMode(!darkMode)} className="text-gray-500 dark:text-gray-400">
            {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
          
          <NotificationBell />
          
          {/* إعدادات النظام (ترس) */}
          <div className="relative" ref={settingsDropdownRef}>
            <button onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)} className="text-gray-500 dark:text-gray-400">
              <Cog6ToothIcon className="h-6 w-6" />
            </button>
            {settingsDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  ⚙️ إعدادات النظام
                </Link>
                {isAdmin && (
                  <Link to="/users" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    👥 إدارة المستخدمين
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* قائمة المستخدم */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2">
              <UserCircleIcon className="h-8 w-8 text-gray-600 dark:text-gray-300" />
              <span className="text-sm text-gray-700 dark:text-gray-200 hidden sm:inline">{user?.name}</span>
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  👤 الملف الشخصي
                </Link>
                <button onClick={logout} className="block w-full text-right px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                  🚪 تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;