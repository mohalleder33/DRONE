import React, { useState, useEffect, useRef } from 'react';
import { BellIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount, getAlerts } from '../../services/notificationService';
import { useSocket } from '../../hooks/useSocket';
import useNotificationSound from '../../hooks/useNotificationSound';
import { formatDateTime } from '../../utils/dateUtils';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' or 'alerts'
  const dropdownRef = useRef();
  const { socket } = useSocket();
  const { playSound } = useNotificationSound();

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications(20);
      setNotifications(res.data);
      const countRes = await getUnreadCount();
      setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await getAlerts(false, 1, 10);
      setAlerts(res.data.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchAlerts();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('new_notification', (notif) => {
        setNotifications(prev => [notif, ...prev.slice(0, 19)]);
        setUnreadCount(prev => prev + 1);
        playSound();
      });
      return () => socket.off('new_notification');
    }
  }, [socket, playSound]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
    fetchNotifications();
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    fetchNotifications();
  };

  const totalBadge = unreadCount + alerts.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setShowDropdown(!showDropdown)} className="relative p-1">
        <BellIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        {totalBadge > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {totalBadge > 9 ? '9+' : totalBadge}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute left-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${activeTab === 'notifications' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
            >
              الإشعارات {notifications.filter(n => !n.read).length > 0 && `(${notifications.filter(n => !n.read).length})`}
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${activeTab === 'alerts' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
            >
              التنبيهات {alerts.length > 0 && `(${alerts.length})`}
            </button>
          </div>

          {/* Header with mark all button */}
          <div className="p-3 border-b flex justify-between items-center">
            <span className="font-semibold">{activeTab === 'notifications' ? 'الإشعارات' : 'التنبيهات'}</span>
            {activeTab === 'notifications' && (
              <button onClick={handleMarkAll} className="text-xs text-blue-600 hover:underline">
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {activeTab === 'notifications' ? (
              notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">لا توجد إشعارات</div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif._id}
                    className={`p-3 border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${!notif.read ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                    onClick={() => handleMarkAsRead(notif._id)}
                  >
                    <div className="font-medium text-sm">{notif.title}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notif.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatDateTime(notif.createdAt)}</div>
                  </div>
                ))
              )
            ) : (
              alerts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">لا توجد تنبيهات</div>
              ) : (
                alerts.map(alert => (
                  <div
                    key={alert._id}
                    className={`p-3 border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${alert.severity === 'critical' ? 'border-r-4 border-red-500' : alert.severity === 'warning' ? 'border-r-4 border-yellow-500' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className={`h-4 w-4 ${alert.severity === 'critical' ? 'text-red-500' : alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`} />
                      <div className="font-medium text-sm">{alert.title}</div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{alert.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatDateTime(alert.createdAt)}</div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;