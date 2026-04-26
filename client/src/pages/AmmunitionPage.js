import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAmmunition, applyCriticalThresholdToAll } from '../services/ammunitionService';
import { getPlatforms } from '../services/platformsService';
import AmmunitionCards from '../components/Ammunition/AmmunitionCards';
import AddAmmunitionModal from '../components/Ammunition/AddAmmunitionModal';
import BulkAddAmmunitionModal from '../components/Ammunition/BulkAddAmmunitionModal';
import { can } from '../utils/roleUtils';
import toast from 'react-hot-toast';
import { AMMUNITION_TYPES } from '../constants/ammunitionConstants';

const AmmunitionPage = () => {
  const { user } = useAuth();
  const [ammunition, setAmmunition] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [platforms, setPlatforms] = useState([]);

  // ✅ صلاحيات المستخدم
  const canCreate = can(user, 'create');
  const canDistribute = can(user, 'distribute_ammunition');
  const canScrap = can(user, 'scrap_ammunition');
  const isAdmin = user?.role === 'admin';

  const fetchAmmunition = async () => {
    setLoading(true);
    try {
      const res = await getAmmunition(pagination.page, pagination.limit, { search, type: typeFilter });
      setAmmunition(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) { 
      toast.error('فشل تحميل الذخائر'); 
    } finally { 
      setLoading(false); 
    }
  };
  
  const fetchPlatforms = async () => { 
    try { 
      const res = await getPlatforms(1, 100); 
      setPlatforms(res.data.data); 
    } catch(e){} 
  };
  
  useEffect(() => { 
    fetchAmmunition(); 
    fetchPlatforms(); 
  }, [pagination.page, search, typeFilter]);

  const handleApplyCritical = async () => {
    if (!window.confirm('تطبيق الحد الحرج على جميع الذخائر؟')) return;
    try { 
      await applyCriticalThresholdToAll(); 
      toast.success('تم التطبيق'); 
      fetchAmmunition(); 
    } catch(e){ 
      toast.error('فشل التطبيق'); 
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">إدارة الذخائر</h1>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={handleApplyCritical} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition">
              تطبيق الحد الحرج على الكل
            </button>
          )}
          {canCreate && (
            <button onClick={() => setShowBulkAddModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition">
              توريد كمية
            </button>
          )}
          {canCreate && (
            <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition">
              + إضافة صنف جديد
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="بحث بالاسم أو العيار"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded p-2 dark:bg-gray-700 w-64"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded p-2 dark:bg-gray-700"
        >
          <option value="">جميع الأنواع</option>
          {AMMUNITION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      
      <AmmunitionCards 
        ammunition={ammunition} 
        loading={loading} 
        platforms={platforms} 
        onRefresh={fetchAmmunition} 
        userRole={user?.role}
        canDistribute={canDistribute}
        canScrap={canScrap}
      />
      
      <div className="flex justify-between items-center">
        <button 
          disabled={pagination.page === 1} 
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} 
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          السابق
        </button>
        <span>{pagination.page} / {pagination.pages}</span>
        <button 
          disabled={pagination.page === pagination.pages} 
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} 
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          التالي
        </button>
      </div>
      
      {showAddModal && <AddAmmunitionModal onClose={() => setShowAddModal(false)} onSuccess={fetchAmmunition} />}
      {showBulkAddModal && <BulkAddAmmunitionModal onClose={() => setShowBulkAddModal(false)} onSuccess={fetchAmmunition} />}
    </div>
  );
};

export default AmmunitionPage;