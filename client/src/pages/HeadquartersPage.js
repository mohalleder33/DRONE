import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  UsersIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import StatsCard from '../components/Common/StatsCard';
import AccordionSection from '../components/Common/AccordionSection';
import api from '../services/api';
import { formatDate } from '../utils/dateUtils';
import { can, ROLES } from '../utils/roleUtils';
import AddPersonnelModal from '../components/Personnel/AddPersonnelModal';
import EditEquipmentModal from '../components/Equipment/EditEquipmentModal';
import AddAmmoModal from '../components/Ammunition/BulkAddAmmunitionModal';

const HeadquartersPage = () => {
  const { user } = useAuth();
  const [openSections, setOpenSections] = useState({
    personnel: true,
    equipment: true,
    ammunition: true,
    workshop: true,
    retired: true,
    critical: true
  });

    // ✅ دوال التحقق من الصلاحيات
  const canAssign = can(user, 'assign_personnel');
  const canDistributeAmmo = can(user, 'distribute_ammunition');
  const canScrapAmmo = can(user, 'scrap_ammunition');
  const canSendToWorkshop = can(user, 'send_to_workshop');
  const canReturnFromWorkshop = can(user, 'return_from_workshop');
  const canRetire = can(user, 'delete'); // إخراج المعدة من الخدمة
  const canEditPersonnel = user?.role === ROLES.ADMIN;
  const canAddEquipment = user?.role === ROLES.ADMIN;


  // Personnel state
  const [personnel, setPersonnel] = useState([]);
  const [personnelStats, setPersonnelStats] = useState({ total: 0, distribution: 0, present: 0 });
  const [filterStatus, setFilterStatus] = useState('all');
  const [personnelSearch, setPersonnelSearch] = useState('');
  const [personnelPage, setPersonnelPage] = useState(1);
  const [personnelTotalPages, setPersonnelTotalPages] = useState(1);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [selectedPlatformId, setSelectedPlatformId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [platforms, setPlatforms] = useState([]);
  const [showAddPersonnelModal, setShowAddPersonnelModal] = useState(false);
  const [personnelType, setPersonnelType] = useState('officers');
  const [personnelTypeFilter, setPersonnelTypeFilter] = useState('all');

  // Equipment state with pagination
  const [equipment, setEquipment] = useState([]);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [equipmentPage, setEquipmentPage] = useState(1);
  const [equipmentTotalPages, setEquipmentTotalPages] = useState(1);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showEditEquipmentModal, setShowEditEquipmentModal] = useState(false);

  // Ammunition state
  const [ammunition, setAmmunition] = useState([]);
  const [ammunitionSearch, setAmmunitionSearch] = useState('');
  const [ammunitionPage, setAmmunitionPage] = useState(1);
  const [ammunitionTotalPages, setAmmunitionTotalPages] = useState(1);
  const [showAddAmmoModal, setShowAddAmmoModal] = useState(false);
  const [modalState, setModalState] = useState({ type: null, data: null, open: false });
  const [distributeQuantity, setDistributeQuantity] = useState(1);
  const [newThreshold, setNewThreshold] = useState(0);
  const [scrapQuantity, setScrapQuantity] = useState(1);
  const [scrapReason, setScrapReason] = useState('');

  // Workshop state with pagination
  const [workshop, setWorkshop] = useState([]);
  const [workshopPage, setWorkshopPage] = useState(1);
  const [workshopTotalPages, setWorkshopTotalPages] = useState(1);
  const [showWorkshopActionModal, setShowWorkshopActionModal] = useState(null);
  const [repairNotes, setRepairNotes] = useState('');
  const [retireReason, setRetireReason] = useState('');

  // Retired state with pagination
  const [retired, setRetired] = useState([]);
  const [retiredPage, setRetiredPage] = useState(1);
  const [retiredTotalPages, setRetiredTotalPages] = useState(1);

  // Critical items
  const [criticalAmmo, setCriticalAmmo] = useState([]);
  const [criticalEquipment, setCriticalEquipment] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleSection = (section) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        personnelRes,
        equipmentRes,
        ammunitionRes,
        workshopRes,
        retiredRes,
        criticalAmmoRes,
        criticalEquipRes,
        platformsRes
      ] = await Promise.all([
        api.get('/headquarters/stats'),
        api.get('/headquarters/personnel', { params: { page: personnelPage, limit: 5, status: filterStatus, search: personnelSearch } }),
        api.get('/headquarters/equipment', { params: { search: equipmentSearch, page: equipmentPage, limit: 5 } }),
        api.get('/headquarters/ammunition', { params: { page: ammunitionPage, limit: 5, search: ammunitionSearch } }),
        api.get('/headquarters/workshop', { params: { page: workshopPage, limit: 5 } }),
        api.get('/headquarters/retired', { params: { page: retiredPage, limit: 5 } }),
        api.get('/headquarters/critical/ammunition'),
        api.get('/headquarters/critical/equipment'),
        api.get('/platforms', { params: { limit: 100 } })
      ]);

      setPersonnelStats(statsRes.data);
      setPersonnel(personnelRes.data?.data || []);
      setPersonnelTotalPages(personnelRes.data?.pagination?.pages || 1);

      setEquipment(equipmentRes.data?.data || []);
      setEquipmentTotalPages(equipmentRes.data?.pagination?.pages || 1);

      setAmmunition(ammunitionRes.data?.data || []);
      setAmmunitionTotalPages(ammunitionRes.data?.pagination?.pages || 1);

      setWorkshop(workshopRes.data?.data || []);
      setWorkshopTotalPages(workshopRes.data?.pagination?.pages || 1);

      setRetired(retiredRes.data?.data || []);
      setRetiredTotalPages(retiredRes.data?.pagination?.pages || 1);

      setCriticalAmmo(criticalAmmoRes.data || []);
      setCriticalEquipment(criticalEquipRes.data || []);
      setPlatforms(platformsRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [personnelPage, filterStatus, personnelSearch, ammunitionPage, ammunitionSearch, equipmentSearch, equipmentPage, workshopPage, retiredPage]);

  // Personnel functions
  const handleStatusChange = async (id, newStatus, type) => {
    try {
      await api.put(`/${type}/${id}`, { attendanceStatus: newStatus });
      toast.success('تم تحديث الحالة');
      fetchAllData();
    } catch (error) {
      toast.error('فشل تحديث الحالة');
    }
  };

  const handleAssign = async () => {
    if (!selectedPersonnel || !selectedPlatformId || !startDate || !endDate) {
      toast.error('يرجى إكمال جميع الحقول');
      return;
    }
    try {
      await api.post('/headquarters/assign', {
        type: selectedPersonnel.type,
        id: selectedPersonnel._id || selectedPersonnel.id,
        platformId: selectedPlatformId,
        startDate,
        endDate
      });
      toast.success('تم تعيين الكادر');
      setShowAssignModal(false);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل التعيين');
    }
  };

  // Equipment functions
  const handleDeleteEquipment = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المعدة؟')) {
      try {
        await api.delete(`/equipment/${id}`);
        toast.success('تم الحذف');
        fetchAllData();
      } catch (error) {
        toast.error('فشل الحذف');
      }
    }
  };

  // Workshop functions
const handleReturnFromWorkshop = async (id, notes) => {
  if (!id) {
    toast.error('معرف المعدة غير صالح');
    return;
  }
  try {
    await api.post(`/equipment/return-from-workshop/${id}`, { repairNotes: notes });
    toast.success('تم إعادة المعدة من الورشة');
    fetchAllData();
  } catch (error) {
    console.error('Return from workshop error:', error);
    toast.error('فشل الإعادة');
  }
};

const handleRetireEquipment = async (id, reason) => {
  if (!id) {
    toast.error('معرف المعدة غير صالح');
    return;
  }
  try {
    await api.post(`/equipment/retire/${id}`, { reason });
    toast.success('تم إخراج المعدة من الخدمة');
    fetchAllData();
  } catch (error) {
    toast.error('فشل الإخراج');
  }
};
  // Ammunition functions
  const handleDistributeAmmo = async (id, platformId, quantity) => {
    try {
      await api.post(`/ammunition/distribute/${id}`, { platformId, quantity });
      toast.success('تم التوزيع');
      setModalState({ open: false });
      fetchAllData();
    } catch (error) {
      toast.error('فشل التوزيع');
    }
  };

  const handleUpdateThreshold = async (stockId, newThreshold) => {
    try {
      await api.put(`/ammunition/update-threshold/${stockId}`, { minThreshold: newThreshold });
      toast.success('تم تحديث الحد');
      setModalState({ open: false });
      fetchAllData();
    } catch (error) {
      toast.error('فشل التحديث');
    }
  };

  const handleScrapAmmo = async (id, locationType, locationId, quantity, reason) => {
    try {
      await api.post(`/ammunition/scrap/${id}`, { locationType, locationId, quantity, reason });
      toast.success('تم الإعدام');
      setModalState({ open: false });
      fetchAllData();
    } catch (error) {
      toast.error('فشل الإعدام');
    }
  };

  const handleShowDetails = (ammo) => {
    const platforms = ammo.distribution?.platforms || {};
    const hasPlatforms = Object.keys(platforms).length > 0;

    toast.custom((t) => (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md w-full">
        <div className="flex justify-between items-center mb-3">
          <strong className="text-lg text-gray-800 dark:text-white">{ammo.name}</strong>
          <button onClick={() => toast.dismiss(t.id)} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="font-semibold">المستودع:</span> {ammo.quantity}</p>
          <p><span className="font-semibold">الحد الأدنى:</span> {ammo.minThreshold}</p>
          {hasPlatforms && (
            <div>
              <p className="font-semibold mb-1">التوزيع على المنصات:</p>
              <div className="max-h-32 overflow-y-auto border rounded">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr><th className="p-1 text-right">المنصة</th><th className="p-1 text-right">الكمية</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(platforms).map(([platform, quantity]) => (
                      <tr key={platform} className="border-t">
                        <td className="p-1">{platform}</td>
                        <td className="p-1">{quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {!hasPlatforms && <p className="text-gray-500">لا توجد توزيعات على منصات</p>}
        </div>
      </div>
    ), { duration: 5000 });
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

 
  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="قوة الرئاسة" value={personnelStats.total} icon={UsersIcon} color="blue" />
        <StatsCard title="معدات المستودع" value={equipment.reduce((acc, g) => acc + g.total, 0)} icon={BuildingOfficeIcon} color="green" />
        <StatsCard title="توزيعات الرئاسة" value={personnelStats.distribution} icon={UserGroupIcon} color="yellow" />
      </div>

      {/* Personnel Section */}
      <AccordionSection section="personnel" isOpen={openSections.personnel} onToggle={toggleSection} title="👥 الكوادر (غير المعينين)">
        <div className="flex flex-wrap gap-4 mb-4 justify-between">
          <div className="flex gap-2">
            {canEditPersonnel && (
              <button onClick={() => setShowAddPersonnelModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2">
                <PlusIcon className="h-5 w-5" /> إضافة كادر
              </button>
            )}
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded-md px-2 py-1 dark:bg-gray-700">
              <option value="all">الكل</option>
              <option value="present">حاضر</option><option value="leave">إذن</option><option value="sick">علاج</option>
              <option value="absent">غياب</option><option value="absent_unauthorized">هروب</option><option value="prison">سجن</option>
              <option value="student">دارس</option><option value="other">أخرى</option>
            </select>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="بحث بالاسم أو الرقم" value={personnelSearch} onChange={(e) => setPersonnelSearch(e.target.value)} className="pr-10 border rounded-md px-3 py-2 w-64 dark:bg-gray-700" />
          </div>
        </div>
        
        {/* أزرار تصنيف الكوادر */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setPersonnelTypeFilter('all')} className={`px-3 py-1 rounded ${personnelTypeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>الجميع</button>
          <button onClick={() => setPersonnelTypeFilter('officers')} className={`px-3 py-1 rounded ${personnelTypeFilter === 'officers' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>الضباط</button>
          <button onClick={() => setPersonnelTypeFilter('ncos')} className={`px-3 py-1 rounded ${personnelTypeFilter === 'ncos' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>ضباط الصف</button>
          <button onClick={() => setPersonnelTypeFilter('recruits')} className={`px-3 py-1 rounded ${personnelTypeFilter === 'recruits' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>المستنفرين</button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr><th className="px-4 py-2">الاسم</th><th>الرتبة</th><th>الرقم العسكري</th><th>الحالة</th><th>الإجراءات</th></tr>
            </thead>
            <tbody>
              {personnel
                .filter(p => personnelTypeFilter === 'all' || p.type === personnelTypeFilter)
                .map(p => (
                  <tr key={p._id || p.id} className="border-b dark:border-gray-700">
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2">{p.rank}</td>
                    <td className="px-4 py-2">{p.militaryId}</td>
                    <td className="px-4 py-2">
                      <select value={p.attendanceStatus} onChange={(e) => handleStatusChange(p._id || p.id, e.target.value, p.type)} className="border rounded px-2 py-1 text-sm dark:bg-gray-800">
                        <option value="present">حاضر</option><option value="leave">إذن</option><option value="sick">علاج</option>
                        <option value="absent">غياب</option><option value="absent_unauthorized">هروب</option><option value="prison">سجن</option>
                        <option value="student">دارس</option><option value="other">أخرى</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      {canAssign && p.attendanceStatus === 'present' && (
                        <button onClick={() => { setSelectedPersonnel(p); setShowAssignModal(true); }} className="text-green-600">تعيين</button>
                      )}
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex justify-between mt-4">
          <button disabled={personnelPage === 1} onClick={() => setPersonnelPage(p => p - 1)} className="px-3 py-1 bg-gray-200 rounded">السابق</button>
          <span>{personnelPage} / {personnelTotalPages}</span>
          <button disabled={personnelPage === personnelTotalPages} onClick={() => setPersonnelPage(p => p + 1)} className="px-3 py-1 bg-gray-200 rounded">التالي</button>
        </div>
      </AccordionSection>

      {/* Equipment Section */}
      <AccordionSection section="equipment" isOpen={openSections.equipment} onToggle={toggleSection} title="🔧 المعدات في المستودع الرئيسي">
        <div className="flex justify-between mb-4">
          {canAddEquipment && (
            <button onClick={() => setShowAddEquipmentModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md">+ إضافة معدة</button>
          )}
          <input type="text" placeholder="بحث بالاسم أو الموديل" value={equipmentSearch} onChange={(e) => setEquipmentSearch(e.target.value)} className="border rounded-md px-3 py-2 dark:bg-gray-700" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((group, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-bold">{group.name} - {group.model} ({group.type})</h3>
              {group.items?.map(item => (
                <div key={item.id} className="border-t pt-2 mt-2 flex justify-between items-center">
                  <div><div className="text-sm">{item.serialNumber}</div><div className="text-xs">{item.status}</div></div>
                  <div>
                    {canAddEquipment && (
                      <>
                        <button onClick={() => { setSelectedEquipment(item); setShowEditEquipmentModal(true); }} className="text-blue-600 ml-2"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteEquipment(item.id)} className="text-red-600"><TrashIcon className="h-4 w-4" /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4">
          <button disabled={equipmentPage === 1} onClick={() => setEquipmentPage(p => p - 1)} className="px-3 py-1 bg-gray-200 rounded">السابق</button>
          <span>{equipmentPage} / {equipmentTotalPages}</span>
          <button disabled={equipmentPage === equipmentTotalPages} onClick={() => setEquipmentPage(p => p + 1)} className="px-3 py-1 bg-gray-200 rounded">التالي</button>
        </div>
      </AccordionSection>

      {/* Ammunition Section */}
      <AccordionSection section="ammunition" isOpen={openSections.ammunition} onToggle={toggleSection} title="💣 الذخائر في المستودع الرئيسي">
        <div className="flex justify-between mb-4">
          {canDistributeAmmo && (
            <button onClick={() => setShowAddAmmoModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md">+ توريد ذخيرة</button>
          )}
          <input type="text" placeholder="بحث بالاسم أو العيار" value={ammunitionSearch} onChange={(e) => setAmmunitionSearch(e.target.value)} className="border rounded-md px-3 py-2" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead><tr><th>الاسم</th><th>العيار</th><th>الكمية</th><th>الحد الأدنى</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {ammunition.map(a => (
                <tr key={a.id} className={a.quantity <= a.minThreshold ? 'bg-red-50 dark:bg-red-900' : ''}>
                  <td className="p-2">{a.name}</td><td className="p-2">{a.caliber}</td><td className="p-2">{a.quantity}</td><td className="p-2">{a.minThreshold}</td>
                  <td className="flex gap-2">
                    {canDistributeAmmo && <button onClick={() => setModalState({ type: 'distribute', data: a, open: true })} className="text-blue-600">توزيع</button>}
                    <button onClick={() => setModalState({ type: 'threshold', data: a, open: true })} className="text-yellow-600">تعديل الحد</button>
                    {canScrapAmmo && <button onClick={() => setModalState({ type: 'scrap', data: a, open: true })} className="text-red-600">إعدام</button>}
                    <button onClick={() => handleShowDetails(a)} className="text-gray-600">تفاصيل</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between mt-4">
          <button disabled={ammunitionPage === 1} onClick={() => setAmmunitionPage(p => p - 1)} className="px-3 py-1 bg-gray-200 rounded">السابق</button>
          <span>{ammunitionPage} / {ammunitionTotalPages}</span>
          <button disabled={ammunitionPage === ammunitionTotalPages} onClick={() => setAmmunitionPage(p => p + 1)} className="px-3 py-1 bg-gray-200 rounded">التالي</button>
        </div>
      </AccordionSection>

      {/* Workshop Section */}
      <AccordionSection section="workshop" isOpen={openSections.workshop} onToggle={toggleSection} title="🔧 الورشة">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workshop.map((group, idx) => (
            <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded">
              <h3 className="font-bold">{group.name} - {group.model}</h3>
              {group.items?.map(item => (
                <div key={item.id} className="border-t mt-2 pt-2">
                  <div className="text-sm">الرقم التسلسلي: {item.serialNumber}</div>
                  <div className="text-xs">منصة المصدر: {item.fromPlatform || 'غير معروف'}</div>
                  <div className="text-xs">العطل: {item.faultDescription?.substring(0, 50)}...</div>
                  <div className="flex gap-2 mt-1">
                    {canReturnFromWorkshop && (
<button
  onClick={() => {
    setShowWorkshopActionModal({ type: 'return', item });
    setRepairNotes('');
  }}
  className="text-green-600 text-sm"
>
  إعادة
</button>                    )}
                    {canRetire && (
                      <button onClick={() => { setShowWorkshopActionModal({ type: 'retire', item }); setRetireReason(''); }} className="text-red-600 text-sm">إخراج</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4">
          <button disabled={workshopPage === 1} onClick={() => setWorkshopPage(p => p - 1)} className="px-3 py-1 bg-gray-200 rounded">السابق</button>
          <span>{workshopPage} / {workshopTotalPages}</span>
          <button disabled={workshopPage === workshopTotalPages} onClick={() => setWorkshopPage(p => p + 1)} className="px-3 py-1 bg-gray-200 rounded">التالي</button>
        </div>
      </AccordionSection>

      {/* Retired Section */}
      <AccordionSection section="retired" isOpen={openSections.retired} onToggle={toggleSection} title="⚠️ معدات خارج الخدمة">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {retired.map((group, idx) => (
            <div key={idx} className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
              <h3 className="font-bold">{group.name} - {group.model}</h3>
              {group.items?.map(item => (
                <div key={item.id} className="border-t mt-2 pt-2 text-sm">
                  <div>الرقم التسلسلي: {item.serialNumber}</div>
                  <div>سبب الإخراج: {item.retireReason}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4">
          <button disabled={retiredPage === 1} onClick={() => setRetiredPage(p => p - 1)} className="px-3 py-1 bg-gray-200 rounded">السابق</button>
          <span>{retiredPage} / {retiredTotalPages}</span>
          <button disabled={retiredPage === retiredTotalPages} onClick={() => setRetiredPage(p => p + 1)} className="px-3 py-1 bg-gray-200 rounded">التالي</button>
        </div>
      </AccordionSection>

      {/* Critical Section */}
      <AccordionSection section="critical" isOpen={openSections.critical} onToggle={toggleSection} title="🔥 العناصر الحرجة">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><h3 className="font-bold text-red-600">ذخائر حرجة</h3>{criticalAmmo.map(a => <div key={a.id} className="bg-red-50 p-2 my-2 rounded">{a.name} - الكمية: {a.quantity} (الحد {a.minThreshold})</div>)}</div>
          <div><h3 className="font-bold text-red-600">معدات حرجة</h3>{criticalEquipment.map(e => <div key={e.id} className="bg-red-50 p-2 my-2 rounded">{e.name} - العدد: {e.quantity} (الحد {e.threshold})</div>)}</div>
        </div>
      </AccordionSection>

      {/* Modals */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded w-96">
            <h3>تعيين كادر</h3>
            <select value={selectedPlatformId} onChange={(e) => setSelectedPlatformId(e.target.value)} className="w-full border p-2 my-2 rounded">
              <option value="">اختر المنصة</option>
              {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border p-2 my-2 rounded" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border p-2 my-2 rounded" />
            <div className="flex justify-end gap-2"><button onClick={() => setShowAssignModal(false)} className="px-4 py-2 bg-gray-300 rounded">إلغاء</button><button onClick={handleAssign} className="px-4 py-2 bg-blue-600 text-white rounded">تأكيد</button></div>
          </div>
        </div>
      )}
      {showAddPersonnelModal && <AddPersonnelModal type={personnelType} onClose={() => setShowAddPersonnelModal(false)} onSuccess={fetchAllData} />}
      {showEditEquipmentModal && selectedEquipment && <EditEquipmentModal equipment={selectedEquipment} onClose={() => setShowEditEquipmentModal(false)} onSuccess={fetchAllData} />}
      {showAddAmmoModal && <AddAmmoModal onClose={() => setShowAddAmmoModal(false)} onSuccess={fetchAllData} />}
      {modalState.open && modalState.type === 'distribute' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded w-96"><h3>توزيع {modalState.data?.name}</h3><select onChange={(e) => setSelectedPlatformId(e.target.value)} className="w-full border p-2 my-2"><option value="">اختر المنصة</option>{platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input type="number" value={distributeQuantity} onChange={(e) => setDistributeQuantity(Number(e.target.value))} className="w-full border p-2" /><div className="flex justify-end gap-2 mt-2"><button onClick={() => setModalState({ open: false })}>إلغاء</button><button onClick={() => handleDistributeAmmo(modalState.data.id, selectedPlatformId, distributeQuantity)}>توزيع</button></div></div></div>
      )}
      {modalState.open && modalState.type === 'threshold' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded w-96"><h3>تعديل الحد لـ {modalState.data?.name}</h3><input type="number" value={newThreshold} onChange={(e) => setNewThreshold(Number(e.target.value))} className="w-full border p-2" /><div className="flex justify-end gap-2 mt-2"><button onClick={() => setModalState({ open: false })}>إلغاء</button><button onClick={() => handleUpdateThreshold(modalState.data.id, newThreshold)}>حفظ</button></div></div></div>
      )}
      {modalState.open && modalState.type === 'scrap' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded w-96"><h3>إعدام {modalState.data?.name}</h3><input type="number" value={scrapQuantity} onChange={(e) => setScrapQuantity(Number(e.target.value))} className="w-full border p-2 my-2" /><textarea placeholder="السبب" value={scrapReason} onChange={(e) => setScrapReason(e.target.value)} className="w-full border p-2" rows="2"></textarea><div className="flex justify-end gap-2 mt-2"><button onClick={() => setModalState({ open: false })}>إلغاء</button><button onClick={() => handleScrapAmmo(modalState.data.id, 'headquarters', null, scrapQuantity, scrapReason)}>إعدام</button></div></div></div>
      )}
{showWorkshopActionModal && showWorkshopActionModal.type === 'return' && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
      <h3 className="text-xl font-bold mb-4">إعادة المعدة من الورشة</h3>
      <p className="mb-2">{showWorkshopActionModal.item.name} - {showWorkshopActionModal.item.serialNumber}</p>
      <textarea
        placeholder="ملاحظات الإصلاح (اختياري)"
        value={repairNotes}
        onChange={(e) => setRepairNotes(e.target.value)}
        className="w-full border p-2 mb-4 rounded dark:bg-gray-700"
        rows="3"
      />
      <div className="flex justify-end gap-2">
        <button onClick={() => setShowWorkshopActionModal(null)} className="px-4 py-2 bg-gray-300 rounded">إلغاء</button>
        <button
          onClick={() => handleReturnFromWorkshop(showWorkshopActionModal.item._id, repairNotes)}  // ✅ استخدم _id
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          تأكيد الإعادة
        </button>
      </div>
    </div>
  </div>
)}
{showWorkshopActionModal && showWorkshopActionModal.type === 'retire' && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
      <h3 className="text-xl font-bold mb-4 text-red-600">إخراج المعدة من الخدمة</h3>
      <p className="mb-2">{showWorkshopActionModal.item.name} - {showWorkshopActionModal.item.serialNumber}</p>
      <textarea
        placeholder="سبب الإخراج"
        value={retireReason}
        onChange={(e) => setRetireReason(e.target.value)}
        className="w-full border p-2 mb-4 rounded dark:bg-gray-700"
        rows="2"
        required
      />
      <div className="flex justify-end gap-2">
        <button onClick={() => setShowWorkshopActionModal(null)} className="px-4 py-2 bg-gray-300 rounded">إلغاء</button>
        <button
          onClick={() => handleRetireEquipment(showWorkshopActionModal.item.id, retireReason)}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          تأكيد الإخراج
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default HeadquartersPage;