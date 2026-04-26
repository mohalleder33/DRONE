import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getRecruits, updateRecruit, deleteRecruit } from '../../services/personnelService';
import { ATTENDANCE_STATUS, getStatusColor } from '../../constants/personnelConstants';
import AddPersonnelModal from './AddPersonnelModal';
import ViewPersonnelModal from './ViewPersonnelModal';
import EditPersonnelModal from './EditPersonnelModal';
import AssignPersonnelModal from './AssignPersonnelModal';
import ReturnPersonnelModal from './ReturnPersonnelModal';
import EditRotationModal from './EditRotationModal';

const RecruitsList = ({ user, onRefresh }) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showRotationModal, setShowRotationModal] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getRecruits(pagination.page, pagination.limit, { search, attendanceStatus: statusFilter });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) { 
      toast.error('فشل تحميل المستنفرين'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, search, statusFilter]);

  const handleStatusChange = async (item, newStatus) => {
    const id = item._id || item.id;
    setStatusUpdating(prev => ({ ...prev, [id]: true }));
    try {
      await updateRecruit(id, { attendanceStatus: newStatus });
      toast.success('تم تحديث الحالة');
      fetchData();
    } catch (error) {
      toast.error('فشل التحديث');
    } finally {
      setStatusUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async (item) => {
    const id = item._id || item.id;
    if (window.confirm('هل أنت متأكد من حذف هذا المستنفر؟')) {
      try {
        await deleteRecruit(id);
        toast.success('تم الحذف');
        fetchData();
        if (onRefresh) onRefresh();
      } catch (error) {
        toast.error('فشل الحذف');
      }
    }
  };

  const openViewModal = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const openAssignModal = (item) => {
    setSelectedItem(item);
    setShowAssignModal(true);
  };

  const openReturnModal = (item) => {
    setSelectedItem(item);
    setShowReturnModal(true);
  };

  const openRotationModal = (item) => {
    setSelectedItem(item);
    setShowRotationModal(true);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Header with search and filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-2">
          {user?.role === 'admin' && (
            <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition">
              <PlusIcon className="h-5 w-5" /> إضافة مستنفر
            </button>
          )}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="بحث بالاسم أو الرقم" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pr-10 border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white w-64"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white"
          >
            <option value="">جميع الحالات</option>
            {ATTENDANCE_STATUS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">الرقم العسكري</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">الرتبة</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">الاسم</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">التخصص</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">الوحدة</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">حالة الحضور</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">الموقع الحالي</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading && (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500 dark:text-gray-400">جاري التحميل...</td>
              </tr>
            )}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500 dark:text-gray-400">لا توجد بيانات</td>
              </tr>
            )}
            {!loading && data.map((item) => {
              const itemId = item._id || item.id;
              return (
                <tr key={itemId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">{item.militaryId || '—'}</td>
                  <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">{item.rank}</td>
                  <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">{item.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">{item.specialization || '—'}</td>
                  <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">{item.unit || '—'}</td>
                  <td className="px-4 py-2">
                    <select 
                      value={item.attendanceStatus} 
                      onChange={(e) => handleStatusChange(item, e.target.value)} 
                      disabled={statusUpdating[itemId] || (user?.role !== 'admin' && user?.role !== 'commander')} 
                      className={`border rounded px-2 py-1 text-sm ${getStatusColor(item.attendanceStatus)} dark:bg-gray-800 transition`}
                    >
                      {ATTENDANCE_STATUS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">
                    {item.currentLocation === 'headquarters' ? 'الرئاسة' : item.currentLocation}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => openViewModal(item)} className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition" title="عرض">👁️</button>
                      {user?.role === 'admin' && (
                        <>
                          <button onClick={() => openEditModal(item)} className="text-blue-600 hover:text-blue-800 transition" title="تعديل">✏️</button>
                          <button onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-800 transition" title="حذف">🗑️</button>
                        </>
                      )}
                      {item.currentLocation === 'headquarters' && item.attendanceStatus === 'present' && (
                        <button onClick={() => openAssignModal(item)} className="text-green-600 hover:text-green-800 transition" title="تعيين">📤</button>
                      )}
                      {item.currentLocation !== 'headquarters' && (
                        <>
                          <button onClick={() => openReturnModal(item)} className="text-yellow-600 hover:text-yellow-800 transition" title="إعادة">↩️</button>
                          <button onClick={() => openRotationModal(item)} className="text-purple-600 hover:text-purple-800 transition" title="تعديل المأمورية">⚙️</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
        <button 
          disabled={pagination.page === 1} 
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} 
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          السابق
        </button>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          صفحة {pagination.page} من {pagination.pages}
        </span>
        <button 
          disabled={pagination.page === pagination.pages} 
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} 
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          التالي
        </button>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddPersonnelModal 
          type="recruits" 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => { fetchData(); if (onRefresh) onRefresh(); }} 
        />
      )}
      {showViewModal && selectedItem && (
        <ViewPersonnelModal 
          personnel={selectedItem} 
          type="recruits" 
          onClose={() => setShowViewModal(false)} 
        />
      )}
      {showEditModal && selectedItem && (
        <EditPersonnelModal 
          personnel={selectedItem} 
          type="recruits" 
          onClose={() => setShowEditModal(false)} 
          onSuccess={() => { fetchData(); if (onRefresh) onRefresh(); }} 
        />
      )}
      {showAssignModal && selectedItem && (
        <AssignPersonnelModal 
          personnel={selectedItem} 
          type="recruits" 
          onClose={() => setShowAssignModal(false)} 
          onSuccess={() => { fetchData(); if (onRefresh) onRefresh(); }} 
        />
      )}
      {showReturnModal && selectedItem && (
        <ReturnPersonnelModal 
          personnel={selectedItem} 
          type="recruits" 
          platformId={selectedItem.currentLocation} 
          onClose={() => setShowReturnModal(false)} 
          onSuccess={() => { fetchData(); if (onRefresh) onRefresh(); }} 
        />
      )}
      {showRotationModal && selectedItem && (
        <EditRotationModal 
          personnel={selectedItem} 
          type="recruits" 
          currentEndDate={selectedItem.rotationEndDate} 
          onClose={() => setShowRotationModal(false)} 
          onSuccess={() => { fetchData(); if (onRefresh) onRefresh(); }} 
        />
      )}
    </div>
  );
};

export default RecruitsList;