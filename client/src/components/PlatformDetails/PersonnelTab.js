import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatDate, calculateRemainingDays } from '../../utils/dateUtils';
import TransferPersonnelModal from './TransferPersonnelModal';
import ReturnPersonnelModal from './ReturnPersonnelModal';
import EditRotationModal from '../Personnel/EditRotationModal';

const PersonnelTab = ({ platformId, onRefresh }) => {
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [personnelTypeFilter, setPersonnelTypeFilter] = useState('all'); // ✅ جديد
  const [transferModal, setTransferModal] = useState(null);
  const [returnModal, setReturnModal] = useState(null);
  const [editRotationModal, setEditRotationModal] = useState(null);
  const [statusLoading, setStatusLoading] = useState({});

  const fetchPersonnel = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/platforms/${platformId}/personnel`, { params: { search } });
      // إضافة نوع لكل كادر
      const personnelWithType = res.data.map(p => ({
        ...p,
        type: p.constructor?.modelName?.toLowerCase() === 'officer' ? 'officers' :
              p.constructor?.modelName?.toLowerCase() === 'nco' ? 'ncos' : 
              p.type || 'recruits'
      }));
      setPersonnel(personnelWithType);
    } catch (error) {
      toast.error('فشل تحميل الكوادر');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, [platformId, search]);

  const handleStatusChange = async (id, type, newStatus) => {
    setStatusLoading(prev => ({ ...prev, [id]: true }));
    try {
      await api.put(`/${type}/${id}`, { attendanceStatus: newStatus });
      toast.success('تم تحديث الحالة');
      fetchPersonnel();
    } catch (error) {
      toast.error('فشل التحديث');
    } finally {
      setStatusLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // تصفية الكوادر حسب النوع
  const filteredPersonnel = personnel.filter(p => {
    if (personnelTypeFilter === 'all') return true;
    return p.type === personnelTypeFilter;
  });

  // إحصائيات للتبويبات
  const counts = {
    all: personnel.length,
    officers: personnel.filter(p => p.type === 'officers').length,
    ncos: personnel.filter(p => p.type === 'ncos').length,
    recruits: personnel.filter(p => p.type === 'recruits').length
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="بحث بالاسم أو الرقم" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pr-10 border rounded p-2 w-full dark:bg-gray-700" 
          />
        </div>
        <button onClick={fetchPersonnel} className="text-blue-600">
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>

      {/* ✅ أزرار تصنيف الكوادر */}
      <div className="flex gap-2">
        <button 
          onClick={() => setPersonnelTypeFilter('all')} 
          className={`px-3 py-1 rounded text-sm transition ${
            personnelTypeFilter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          الجميع ({counts.all})
        </button>
        <button 
          onClick={() => setPersonnelTypeFilter('officers')} 
          className={`px-3 py-1 rounded text-sm transition ${
            personnelTypeFilter === 'officers' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          الضباط ({counts.officers})
        </button>
        <button 
          onClick={() => setPersonnelTypeFilter('ncos')} 
          className={`px-3 py-1 rounded text-sm transition ${
            personnelTypeFilter === 'ncos' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          ضباط الصف ({counts.ncos})
        </button>
        <button 
          onClick={() => setPersonnelTypeFilter('recruits')} 
          className={`px-3 py-1 rounded text-sm transition ${
            personnelTypeFilter === 'recruits' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          المستنفرين ({counts.recruits})
        </button>
      </div>

      <div className="overflow-x-auto">
<table className="min-w-full bg-white dark:bg-gray-800 rounded shadow">
  <thead className="bg-gray-50 dark:bg-gray-700">
    <tr>
      <th className="p-2">الاسم</th>
      <th className="p-2">الرتبة</th>
      <th className="p-2">الرقم العسكري</th>
      <th className="p-2">الحالة</th>
      <th className="p-2">تاريخ نهاية الاستحقاق</th>
      <th className="p-2">الأيام المتبقية</th>
      <th className="p-2">الإجراءات</th>
    </tr>
  </thead>
  <tbody>
    {loading ? (
      <tr>
        <td colSpan="7" className="text-center p-4">جاري التحميل...</td>
      </tr>
    ) : filteredPersonnel.length === 0 ? (
      <tr>
        <td colSpan="7" className="text-center p-4 text-gray-500">
          لا توجد كوادر في هذا التصنيف
        </td>
      </tr>
    ) : (
      filteredPersonnel.map(p => (
        <tr key={p._id || p.id} className="border-t dark:border-gray-700">
          <td className="p-2">{p.name}</td>
          <td className="p-2">{p.rank}</td>
          <td className="p-2">{p.militaryId}</td>
          <td className="p-2">
            <select 
              value={p.attendanceStatus} 
              onChange={(e) => handleStatusChange(p._id || p.id, p.type, e.target.value)} 
              disabled={statusLoading[p._id || p.id]} 
              className="border rounded p-1 text-sm dark:bg-gray-800"
            >
              <option value="present">حاضر</option>
              <option value="leave">إذن</option>
              <option value="sick">علاج</option>
              <option value="absent">غياب</option>
              <option value="absent_unauthorized">هروب</option>
              <option value="other">أخرى</option>
            </select>
          </td>
          <td className="p-2">{p.rotationEndDate ? formatDate(p.rotationEndDate) : '—'}</td>
          <td className="p-2">
            {p.rotationEndDate ? calculateRemainingDays(p.rotationEndDate) : '—'}
          </td>
          <td className="flex gap-2">
            <button onClick={() => setReturnModal(p)} className="text-yellow-600 text-sm">إعادة</button>
            <button onClick={() => setTransferModal(p)} className="text-blue-600 text-sm">نقل</button>
            <button onClick={() => setEditRotationModal(p)} className="text-purple-600 text-sm">تعديل التاريخ</button>
          </td>
        </tr>
      ))
    )}
  </tbody>
</table>
      </div>

      {/* Modals */}
      {returnModal && (
        <ReturnPersonnelModal 
          personnel={returnModal} 
          platformId={platformId} 
          onClose={() => setReturnModal(null)} 
          onSuccess={() => { fetchPersonnel(); onRefresh(); }} 
        />
      )}
      {transferModal && (
        <TransferPersonnelModal 
          personnel={transferModal} 
          currentPlatformId={platformId} 
          onClose={() => setTransferModal(null)} 
          onSuccess={() => { fetchPersonnel(); onRefresh(); }} 
        />
      )}
      {editRotationModal && (
        <EditRotationModal 
          personnel={editRotationModal} 
          type={editRotationModal.type} 
          currentEndDate={editRotationModal.rotationEndDate} 
          onClose={() => setEditRotationModal(null)} 
          onSuccess={() => { fetchPersonnel(); onRefresh(); }} 
        />
      )}
    </div>
  );
};

export default PersonnelTab;