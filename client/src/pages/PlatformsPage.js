import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import PlatformCard from '../components/Platforms/PlatformCard';
import AddPlatformModal from '../components/Platforms/AddPlatformModal';
import EditPlatformModal from '../components/Platforms/EditPlatformModal';
import ConfirmDisableModal from '../components/Platforms/ConfirmDisableModal';
import { getPlatforms, deletePlatform, disablePlatform, enablePlatform } from '../services/platformsService';
import { filterPlatforms, can, ROLES } from '../utils/roleUtils';

const PlatformsPage = () => {
  const { user } = useAuth();
  const [platforms, setPlatforms] = useState([]);
  const [filteredPlatforms, setFilteredPlatforms] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [showDisableModal, setShowDisableModal] = useState(null);
  
  // Filters
  const [searchName, setSearchName] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [minPower, setMinPower] = useState('');
  const [maxPower, setMaxPower] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const isAdmin = user?.role === ROLES.ADMIN;
  const canEdit = isAdmin || user?.role === ROLES.COMMANDER;

  const fetchPlatforms = async () => {
    setLoading(true);
    try {
      const filters = { name: searchName, location: searchLocation, status: statusFilter, minPower: minPower || undefined, maxPower: maxPower || undefined, sortBy, sortOrder };
      const res = await getPlatforms(pagination.page, pagination.limit, filters);
      const allPlatforms = res.data.data;
      setPlatforms(allPlatforms);
      // ✅ تطبيق فلترة المنصات حسب صلاحية المستخدم
      setFilteredPlatforms(filterPlatforms(user, allPlatforms));
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error('فشل تحميل المنصات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, [pagination.page, searchName, searchLocation, statusFilter, minPower, maxPower, sortBy, sortOrder, user]);

  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error('غير مصرح بحذف المنصات');
      return;
    }
    if (window.confirm('هل أنت متأكد من حذف هذه المنصة؟')) {
      try {
        await deletePlatform(id);
        toast.success('تم الحذف');
        fetchPlatforms();
      } catch (error) {
        toast.error('فشل الحذف');
      }
    }
  };

  const handleDisable = async (id) => {
    if (!canEdit) {
      toast.error('غير مصرح بتعطيل المنصات');
      return;
    }
    try {
      await disablePlatform(id);
      toast.success('تم تعطيل المنصة');
      fetchPlatforms();
    } catch (error) {
      toast.error('فشل التعطيل');
    }
  };

  const handleEnable = async (id) => {
    if (!canEdit) {
      toast.error('غير مصرح بتفعيل المنصات');
      return;
    }
    try {
      await enablePlatform(id);
      toast.success('تم تفعيل المنصة');
      fetchPlatforms();
    } catch (error) {
      toast.error('فشل التفعيل');
    }
  };

  const resetFilters = () => {
    setSearchName('');
    setSearchLocation('');
    setStatusFilter('');
    setMinPower('');
    setMaxPower('');
    setSortBy('name');
    setSortOrder('asc');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">المنصات</h1>
        {isAdmin && (
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition">
            <PlusIcon className="h-5 w-5" /> منصة جديدة
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <input type="text" placeholder="بحث بالاسم" value={searchName} onChange={(e) => setSearchName(e.target.value)} className="border rounded p-2 dark:bg-gray-700" />
        <input type="text" placeholder="بحث بالموقع" value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} className="border rounded p-2 dark:bg-gray-700" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded p-2 dark:bg-gray-700">
          <option value="">جميع الحالات</option>
          <option value="active">فعالة</option>
          <option value="inactive">معطلة</option>
        </select>
        <div className="flex gap-2">
          <input type="number" placeholder="الحد الأدنى للقوة" value={minPower} onChange={(e) => setMinPower(e.target.value)} className="border rounded p-2 w-full dark:bg-gray-700" />
          <input type="number" placeholder="الحد الأقصى" value={maxPower} onChange={(e) => setMaxPower(e.target.value)} className="border rounded p-2 w-full dark:bg-gray-700" />
        </div>
        <div className="flex gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border rounded p-2 dark:bg-gray-700">
            <option value="name">الاسم</option>
            <option value="power">القوة</option>
            <option value="status">الحالة</option>
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="border rounded p-2 dark:bg-gray-700">
            <option value="asc">تصاعدي</option>
            <option value="desc">تنازلي</option>
          </select>
        </div>
        <button onClick={resetFilters} className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-md flex items-center gap-2 justify-center">
          <ArrowPathIcon className="h-4 w-4" /> إعادة تعيين
        </button>
      </div>

      {/* Platforms Grid */}
      {loading ? (
        <div className="text-center py-10">جاري التحميل...</div>
      ) : filteredPlatforms.length === 0 ? (
        <div className="text-center py-10 text-gray-500">لا توجد منصات متاحة لعرضها</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlatforms.map(p => (
            <PlatformCard
              key={p.id}
              platform={p}
              onEdit={() => { if (canEdit) { setSelectedPlatform(p); setShowEditModal(true); } }}
              onDelete={() => handleDelete(p.id)}
              onDisable={() => handleDisable(p.id)}
              onEnable={() => handleEnable(p.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <button disabled={pagination.page === 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50">السابق</button>
        <span>صفحة {pagination.page} من {pagination.pages}</span>
        <button disabled={pagination.page === pagination.pages} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50">التالي</button>
      </div>

      {/* Modals */}
      {showAddModal && <AddPlatformModal onClose={() => setShowAddModal(false)} onSuccess={fetchPlatforms} />}
      {showEditModal && selectedPlatform && <EditPlatformModal platform={selectedPlatform} onClose={() => setShowEditModal(false)} onSuccess={fetchPlatforms} />}
      {showDisableModal && <ConfirmDisableModal platform={showDisableModal} onConfirm={() => { handleDisable(showDisableModal.id); setShowDisableModal(null); }} onClose={() => setShowDisableModal(null)} />}
    </div>
  );
};

export default PlatformsPage;