import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLogs } from '../services/logService';
import { actionNames, actionColors } from '../constants/actionTypes';
import { ROLES } from '../utils/roleUtils';
import toast from 'react-hot-toast';

const LogsPage = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ action: '', entityType: '', search: '', startDate: '', endDate: '' });

  // ✅ التحقق من صلاحية الوصول
  if (user?.role !== ROLES.ADMIN && user?.role !== ROLES.COMMANDER) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="text-red-600 text-xl mb-4">⛔ غير مصرح</div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          سجل التدقيق متاح فقط للمسؤول وقائد الرئاسة
        </p>
      </div>
    );
  }

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getLogs(pagination.page, pagination.limit, filters);
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error('فشل تحميل سجل التدقيق');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const resetFilters = () => {
    setFilters({ action: '', entityType: '', search: '', startDate: '', endDate: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActionBadge = (action) => {
    const name = actionNames[action] || action;
    const color = actionColors[action] || 'gray';
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return <span className={`px-2 py-1 rounded text-xs ${colorClasses[color]}`}>{name}</span>;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">سجل التدقيق</h1>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <input
          type="text"
          placeholder="بحث في التفاصيل"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="border rounded p-2 dark:bg-gray-700"
        />
        <input
          type="text"
          placeholder="نوع العملية"
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="border rounded p-2 dark:bg-gray-700"
        />
        <input
          type="text"
          placeholder="نوع الكيان"
          value={filters.entityType}
          onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
          className="border rounded p-2 dark:bg-gray-700"
        />
        <input
          type="date"
          placeholder="من تاريخ"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          className="border rounded p-2 dark:bg-gray-700"
        />
        <input
          type="date"
          placeholder="إلى تاريخ"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="border rounded p-2 dark:bg-gray-700"
        />
        <button
          onClick={resetFilters}
          className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-md col-span-full lg:col-span-1"
        >
          إعادة تعيين الفلاتر
        </button>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">لا توجد سجلات</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-right">التاريخ</th>
                  <th className="p-3 text-right">المستخدم</th>
                  <th className="p-3 text-right">العملية</th>
                  <th className="p-3 text-right">نوع الكيان</th>
                  <th className="p-3 text-right">التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id} className="border-t dark:border-gray-700">
                    <td className="p-3 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('ar-EG')}</td>
                    <td className="p-3">{log.user?.name || log.userId}</td>
                    <td className="p-3">{getActionBadge(log.action)}</td>
                    <td className="p-3">{log.entityType}</td>
                    <td className="p-3">
                      <pre className="text-xs whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-2 rounded max-w-md overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 flex justify-between items-center border-t">
            <button
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
            >
              السابق
            </button>
            <span className="text-sm">صفحة {pagination.page} من {pagination.pages}</span>
            <button
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsPage;