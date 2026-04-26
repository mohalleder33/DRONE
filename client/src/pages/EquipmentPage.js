import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowPathIcon, Squares2X2Icon, TableCellsIcon } from '@heroicons/react/24/outline';
import { getGroupedEquipment, getEquipment } from '../services/equipmentService';
import EquipmentCards from '../components/Equipment/EquipmentCards';
import EquipmentList from '../components/Equipment/EquipmentList';
import BulkAddEquipmentModal from '../components/Equipment/BulkAddEquipmentModal';
import { can } from '../utils/roleUtils';
import toast from 'react-hot-toast';
import { EQUIPMENT_STATUS, EQUIPMENT_TYPES } from '../constants/equipmentConstants';

const EquipmentPage = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('cards');
  const [groups, setGroups] = useState([]);
  const [listData, setListData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);

  // ✅ صلاحيات المستخدم
  const canCreate = can(user, 'create');
  const canUpdate = can(user, 'update');
  const canDelete = can(user, 'delete');
  const canSendToWorkshop = can(user, 'send_to_workshop');

  const fetchGrouped = async () => {
    setLoading(true);
    try {
      const res = await getGroupedEquipment({ search, status: statusFilter, type: typeFilter });
      setGroups(res.data);
    } catch (error) { 
      toast.error('فشل تحميل المعدات'); 
    } finally { 
      setLoading(false); 
    }
  };
  
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getEquipment(pagination.page, pagination.limit, { search, status: statusFilter, type: typeFilter });
      setListData(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) { 
      toast.error('فشل تحميل المعدات'); 
    } finally { 
      setLoading(false); 
    }
  };
  
  useEffect(() => {
    if (viewMode === 'cards') fetchGrouped();
    else fetchList();
  }, [viewMode, search, statusFilter, typeFilter, pagination.page]);

  const handleRefresh = () => { 
    if (viewMode === 'cards') fetchGrouped(); 
    else fetchList(); 
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">إدارة المعدات</h1>
        {canCreate && (
          <button onClick={() => setShowBulkAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition">
            + إضافة متعددة
          </button>
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
        <input 
          type="text" 
          placeholder="بحث بالاسم أو الموديل أو الرقم التسلسلي" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="">جميع الحالات</option>
          {EQUIPMENT_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)} 
          className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="">جميع الأنواع</option>
          {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button 
          onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')} 
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-4 py-2 rounded-md flex items-center gap-2 justify-center transition"
        >
          {viewMode === 'cards' ? <TableCellsIcon className="h-4 w-4" /> : <Squares2X2Icon className="h-4 w-4" />}
          {viewMode === 'cards' ? 'عرض جدول' : 'عرض بطاقات'}
        </button>
        <button 
          onClick={handleRefresh} 
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-4 py-2 rounded-md flex items-center gap-2 justify-center transition"
        >
          <ArrowPathIcon className="h-4 w-4" /> تحديث
        </button>
      </div>
      
      {viewMode === 'cards' ? (
        <EquipmentCards 
          groups={groups} 
          loading={loading} 
          onRefresh={handleRefresh}
          canUpdate={canUpdate}
          canDelete={canDelete}
          canSendToWorkshop={canSendToWorkshop}
        />
      ) : (
        <EquipmentList 
          data={listData} 
          pagination={pagination} 
          setPagination={setPagination} 
          loading={loading} 
          onRefresh={handleRefresh}
          canUpdate={canUpdate}
          canDelete={canDelete}
          canSendToWorkshop={canSendToWorkshop}
        />
      )}
      
      {showBulkAddModal && <BulkAddEquipmentModal onClose={() => setShowBulkAddModal(false)} onSuccess={handleRefresh} />}
    </div>
  );
};

export default EquipmentPage;