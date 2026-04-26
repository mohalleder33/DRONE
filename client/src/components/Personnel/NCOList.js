import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getNCOs, updateNCO, deleteNCO } from '../../services/personnelService';
import { ATTENDANCE_STATUS, getStatusColor } from '../../constants/personnelConstants';
import AddPersonnelModal from './AddPersonnelModal';
import ViewPersonnelModal from './ViewPersonnelModal';
import EditPersonnelModal from './EditPersonnelModal';
import AssignPersonnelModal from './AssignPersonnelModal';
import ReturnPersonnelModal from './ReturnPersonnelModal';
import EditRotationModal from './EditRotationModal';

const NCOList = ({ user, onRefresh }) => {
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
      const res = await getNCOs(pagination.page, pagination.limit, { search, attendanceStatus: statusFilter });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) { 
      toast.error('فشل تحميل ضباط الصف'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, search, statusFilter]);

  const handleStatusChange = async (item, newStatus) => {
    // ✅ استخدام _id إذا كان موجوداً
    const id = item._id || item.id;
    setStatusUpdating(prev => ({ ...prev, [id]: true }));
    try {
      await updateNCO(id, { attendanceStatus: newStatus });
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
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      try {
        await deleteNCO(id);
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
      <div className="p-4 border-b flex flex-wrap gap-4 justify-between">
        <div className="flex gap-2">
          {user?.role === 'admin' && (
            <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2">
              <PlusIcon className="h-5 w-5" /> إضافة ضابط صف
            </button>
          )}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="بحث" value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 border rounded-md p-2" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-md p-2">
            <option value="">جميع الحالات</option>
            {ATTENDANCE_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">الرقم العسكري</th>
              <th className="px-4 py-2">الرتبة</th>
              <th className="px-4 py-2">الاسم</th>
              <th className="px-4 py-2">التخصص</th>
              <th className="px-4 py-2">الوحدة</th>
              <th className="px-4 py-2">الحالة</th>
              <th className="px-4 py-2">الموقع</th>
              <th className="px-4 py-2">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="8" className="text-center p-4">جاري التحميل...</td></tr>}
            {!loading && data.map(item => {
              const itemId = item._id || item.id;
              return (
                <tr key={itemId} className="border-t">
                  <td className="p-2">{item.militaryId || '—'}</td>
                  <td className="p-2">{item.rank}</td>
                  <td className="p-2">{item.name}</td>
                  <td className="p-2">{item.specialization || '—'}</td>
                  <td className="p-2">{item.unit || '—'}</td>
                  <td className="p-2">
                    <select 
                      value={item.attendanceStatus} 
                      onChange={(e) => handleStatusChange(item, e.target.value)} 
                      disabled={statusUpdating[itemId] || (user?.role !== 'admin' && user?.role !== 'commander')} 
                      className={`border rounded p-1 text-sm ${getStatusColor(item.attendanceStatus)}`}
                    >
                      {ATTENDANCE_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="p-2">{item.currentLocation === 'headquarters' ? 'الرئاسة' : item.currentLocation}</td>
                  <td className="flex gap-2">
                    <button onClick={() => openViewModal(item)} className="text-gray-600" title="عرض">👁️</button>
                    {user?.role === 'admin' && (
                      <>
                        <button onClick={() => openEditModal(item)} className="text-blue-600" title="تعديل">✏️</button>
                        <button onClick={() => handleDelete(item)} className="text-red-600" title="حذف">🗑️</button>
                      </>
                    )}
                    {item.currentLocation === 'headquarters' && item.attendanceStatus === 'present' && (
                      <button onClick={() => openAssignModal(item)} className="text-green-600" title="تعيين">📤</button>
                    )}
                    {item.currentLocation !== 'headquarters' && (
                      <>
                        <button onClick={() => openReturnModal(item)} className="text-yellow-600" title="إعادة">↩️</button>
                        <button onClick={() => openRotationModal(item)} className="text-purple-600" title="تعديل المأمورية">⚙️</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 flex justify-between">
        <button disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} className="px-3 py-1 bg-gray-200 rounded">السابق</button>
        <span>{pagination.page}/{pagination.pages}</span>
        <button disabled={pagination.page === pagination.pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} className="px-3 py-1 bg-gray-200 rounded">التالي</button>
      </div>

      {/* Modals */}
      {showAddModal && <AddPersonnelModal type="ncos" onClose={() => setShowAddModal(false)} onSuccess={() => { fetchData(); onRefresh(); }} />}
      {showViewModal && selectedItem && <ViewPersonnelModal personnel={selectedItem} type="ncos" onClose={() => setShowViewModal(false)} />}
      {showEditModal && selectedItem && <EditPersonnelModal personnel={selectedItem} type="ncos" onClose={() => setShowEditModal(false)} onSuccess={() => { fetchData(); onRefresh(); }} />}
      {showAssignModal && selectedItem && <AssignPersonnelModal personnel={selectedItem} type="ncos" onClose={() => setShowAssignModal(false)} onSuccess={() => { fetchData(); onRefresh(); }} />}
      {showReturnModal && selectedItem && <ReturnPersonnelModal personnel={selectedItem} type="ncos" platformId={selectedItem.currentLocation} onClose={() => setShowReturnModal(false)} onSuccess={() => { fetchData(); onRefresh(); }} />}
      {showRotationModal && selectedItem && <EditRotationModal personnel={selectedItem} type="ncos" currentEndDate={selectedItem.rotationEndDate} onClose={() => setShowRotationModal(false)} onSuccess={() => { fetchData(); onRefresh(); }} />}
    </div>
  );
};

export default NCOList;