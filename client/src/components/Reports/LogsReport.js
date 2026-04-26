import React, { useState, useEffect } from 'react';
import { getLogsReport } from '../../services/reportService';
import { actionNames, actionColors } from '../../constants/actionTypes';
import PrintButton from './PrintButton';
import ExportExcelButton from './ExportExcelButton';
import ExportPDFButton from './ExportPDFButton';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const LogsReport = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  // التحقق من صلاحية الوصول
  if (user?.role !== 'admin' && user?.role !== 'commander') {
    return (
      <div className="text-center py-8 text-red-600">
        غير مصرح لك بالوصول إلى سجل العمليات
      </div>
    );
  }

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getLogsReport(filters, pagination.page, pagination.limit);
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error('فشل تحميل سجل العمليات');
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

  const exportData = logs.map(log => ({
    التاريخ: new Date(log.createdAt).toLocaleString('ar-EG'),
    المستخدم: log.user?.name || log.userId,
    العملية: actionNames[log.action] || log.action,
    'نوع الكيان': log.entityType,
    التفاصيل: JSON.stringify(log.details, null, 2)
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">سجل العمليات</h2>
        <div className="flex gap-2">
          <ExportExcelButton data={exportData} filename="logs_report" />
          <ExportPDFButton data={exportData} title="سجل العمليات" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <input
          type="text"
          placeholder="بحث في التفاصيل"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <input
          type="text"
          placeholder="نوع العملية"
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
          className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <input
          type="text"
          placeholder="نوع الكيان"
          value={filters.entityType}
          onChange={(e) => setFilters({ ...filters, entityType: e.target.value, page: 1 })}
          className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <input
          type="date"
          placeholder="من تاريخ"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
          className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <input
          type="date"
          placeholder="إلى تاريخ"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
          className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <button
          onClick={resetFilters}
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-4 py-2 rounded-md transition col-span-full md:col-span-1"
        >
          إعادة تعيين الفلاتر
        </button>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
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

      {logs.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">لا توجد سجلات</div>
      )}
    </div>
  );
};

export default LogsReport;