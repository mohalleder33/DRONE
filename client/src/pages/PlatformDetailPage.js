import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getPlatformDetails } from '../services/platformsService';
import { canAccessPlatform } from '../utils/roleUtils';
import PersonnelTab from '../components/PlatformDetails/PersonnelTab';
import EquipmentTab from '../components/PlatformDetails/EquipmentTab';
import AmmunitionTab from '../components/PlatformDetails/AmmunitionTab';

const PlatformDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personnel');

  // ✅ التحقق من صلاحية الوصول للمنصة
  const hasAccess = canAccessPlatform(user, id);

  const fetchPlatform = async () => {
    setLoading(true);
    try {
      const res = await getPlatformDetails(id);
      setPlatform(res.data);
    } catch (error) {
      toast.error('فشل تحميل بيانات المنصة');
      navigate('/platforms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchPlatform();
    }
  }, [id, hasAccess]);

  // ✅ إذا لم يكن لديه صلاحية الوصول
  if (!hasAccess) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="text-red-600 text-xl mb-4">⛔ غير مصرح</div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          ليس لديك صلاحية للوصول إلى هذه المنصة
        </p>
        <button
          onClick={() => navigate('/platforms')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          العودة إلى المنصات
        </button>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center">جاري تحميل بيانات المنصة...</div>;
  if (!platform) return null;

  const stats = platform.personnelStats || { power: 0, distribution: 0, present: 0 };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate('/platforms')} className="text-gray-600 dark:text-gray-400 hover:text-gray-800">
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{platform.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{platform.location}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${platform.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
          {platform.status === 'active' ? 'فعالة' : 'معطلة'}
        </span>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div key="stat-power" className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats.power}</div>
          <div>القوة</div>
        </div>
        <div key="stat-distribution" className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{stats.distribution}</div>
          <div>التوزيعات</div>
        </div>
        <div key="stat-present" className="bg-green-100 dark:bg-green-900 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-800 dark:text-green-200">{stats.present}</div>
          <div>الموجود</div>
        </div>
        <div key="stat-equipment" className="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">{platform.equipmentCount || 0}</div>
          <div>عدد المعدات</div>
        </div>
        <div key="stat-ammunition" className="bg-indigo-100 dark:bg-indigo-900 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">{platform.ammunitionCount || 0}</div>
          <div>عدد الذخائر</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          <button
            key="tab-personnel"
            onClick={() => setActiveTab('personnel')}
            className={`pb-2 px-1 ${activeTab === 'personnel' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
          >
            الكوادر
          </button>
          <button
            key="tab-equipment"
            onClick={() => setActiveTab('equipment')}
            className={`pb-2 px-1 ${activeTab === 'equipment' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
          >
            المعدات
          </button>
          <button
            key="tab-ammunition"
            onClick={() => setActiveTab('ammunition')}
            className={`pb-2 px-1 ${activeTab === 'ammunition' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
          >
            الذخائر
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'personnel' && <PersonnelTab platformId={id} onRefresh={fetchPlatform} />}
        {activeTab === 'equipment' && <EquipmentTab platformId={id} onRefresh={fetchPlatform} />}
        {activeTab === 'ammunition' && <AmmunitionTab platformId={id} onRefresh={fetchPlatform} />}
      </div>

      {/* Critical Items & Upcoming Rotations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" /> العناصر الحرجة
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-red-600">المعدات الحرجة</h3>
              {platform.criticalEquipment?.length > 0 ? (
                platform.criticalEquipment.map((eq, idx) => (
                  <div key={idx} className="bg-red-50 dark:bg-red-900/30 p-2 my-2 rounded">
                    {eq.name} - العدد: {eq.quantity} (الحد: {eq.threshold})
                  </div>
                ))
              ) : (
                <p className="text-gray-500">لا توجد معدات حرجة</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-red-600">الذخائر الحرجة</h3>
              {platform.criticalAmmunition?.length > 0 ? (
                platform.criticalAmmunition.map((ammo, idx) => (
                  <div key={idx} className="bg-red-50 dark:bg-red-900/30 p-2 my-2 rounded">
                    {ammo.name} - الكمية: {ammo.quantity} (الحد: {ammo.minThreshold})
                  </div>
                ))
              ) : (
                <p className="text-gray-500">لا توجد ذخائر حرجة</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ClockIcon className="h-6 w-6 text-yellow-500" /> الاستحقاقات الوشيكة
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-2">الاسم</th>
                  <th className="p-2">الرتبة</th>
                  <th className="p-2">تاريخ النهاية</th>
                  <th className="p-2">الأيام المتبقية</th>
                </tr>
              </thead>
              <tbody>
                {platform.upcomingRotations?.length > 0 ? (
                  platform.upcomingRotations.map((rot, idx) => (
                    <tr key={idx} className="border-t dark:border-gray-700">
                      <td className="p-2">{rot.name}</td>
                      <td className="p-2">{rot.rank}</td>
                      <td className="p-2">{new Date(rot.endDate).toLocaleDateString('ar-EG')}</td>
                      <td className="text-red-600 font-bold">{rot.remainingDays}</td>
                    </tr>
                  ))
                ) : (
                  <td>
                    <td colSpan="4" className="text-center p-4">لا توجد استحقاقات وشيكة</td>
                  </td>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformDetailPage;