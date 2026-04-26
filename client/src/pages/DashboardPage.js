import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UsersIcon, UserGroupIcon, CheckCircleIcon, ExclamationTriangleIcon, CubeIcon, BuildingOfficeIcon, TruckIcon } from '@heroicons/react/24/outline';
import StatsCard from '../components/Common/StatsCard';
import { useDashboardData } from '../hooks/useDashboardData';
import { can, ROLES } from '../utils/roleUtils';

const DashboardPage = () => {
  const { user } = useAuth();
  const { data, loading } = useDashboardData();
  const isAdminOrCommander = user?.role === ROLES.ADMIN || user?.role === ROLES.COMMANDER;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600 dark:text-gray-400">جاري تحميل البيانات...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* اليوميات العامة */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">اليوميات العامة</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="القوة" value={data.personnel.general?.power || 0} icon={UsersIcon} color="blue" />
          <StatsCard title="التوزيعات" value={data.personnel.general?.distribution || 0} icon={UserGroupIcon} color="yellow" />
          <StatsCard title="الموجود" value={data.personnel.general?.present || 0} icon={CheckCircleIcon} color="green" />
        </div>
      </div>

      {/* يومية الرئاسة */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">يومية الرئاسة</h2>
        <div className="grid gris-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="القوة" value={data.personnel.headquarters?.power || 0} icon={UsersIcon} color="blue" />
          <StatsCard title="التوزيعات" value={data.personnel.headquarters?.distribution || 0} icon={UserGroupIcon} color="yellow" />
          <StatsCard title="الموجود" value={data.personnel.headquarters?.present || 0} icon={CheckCircleIcon} color="green" />
        </div>
      </div>

      {/* يوميات المنصات */}
      {data.personnel.platforms?.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">يوميات المنصات</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.personnel.platforms.map((platform, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h3 className="font-bold text-lg mb-2">{platform.name}</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><span className="text-blue-600 font-bold">{platform.power}</span><br /><span className="text-xs">القوة</span></div>
                  <div><span className="text-yellow-600 font-bold">{platform.distribution}</span><br /><span className="text-xs">التوزيعات</span></div>
                  <div><span className="text-green-600 font-bold">{platform.present}</span><br /><span className="text-xs">الموجود</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* الاستحقاقات الوشيكة */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">الاستحقاقات الوشيكة</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-right">الرقم العسكري</th>
                <th className="px-4 py-2 text-right">الرتبة</th>
                <th className="px-4 py-2 text-right">الاسم</th>
                <th className="px-4 py-2 text-right">المنصة</th>
                <th className="px-4 py-2 text-right">تاريخ النهاية</th>
                <th className="px-4 py-2 text-right">الأيام المتبقية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.rotations.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4 text-gray-500">لا توجد استحقاقات وشيكة</td></tr>
              ) : (
                data.rotations.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-2">{item.militaryId}</td>
                    <td className="px-4 py-2">{item.rank}</td>
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2">{item.platform}</td>
                    <td className="px-4 py-2">{new Date(item.endDate).toLocaleDateString('ar-EG')}</td>
                    <td className="px-4 py-2 text-red-600 font-bold">{item.remainingDays}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* إحصائيات المعدات */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">إحصائيات المعدات</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatsCard title="الكلية" value={data.equipment.total} icon={CubeIcon} color="blue" />
          <StatsCard title="في الرئاسة" value={data.equipment.inHeadquarters} icon={BuildingOfficeIcon} color="green" />
          <StatsCard title="في المنصات" value={data.equipment.inPlatforms} icon={TruckIcon} color="yellow" />
          <StatsCard title="في الورشة" value={data.equipment.inWorkshop} icon={ExclamationTriangleIcon} color="yellow" />
          <StatsCard title="خارج الخدمة" value={data.equipment.retired} icon={ExclamationTriangleIcon} color="red" />
        </div>
      </div>

      {/* الذخائر */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">الذخائر</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-right">الاسم</th>
                <th className="px-4 py-2 text-right">العيار</th>
                <th className="px-4 py-2 text-right">الإجمالي</th>
                <th className="px-4 py-2 text-right">الرئاسة</th>
                <th className="px-4 py-2 text-right">المنصات</th>
                <th className="px-4 py-2 text-right">الحد الأدنى</th>
              </tr>
            </thead>
            <tbody>
              {data.ammunition.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4 text-gray-500">لا توجد ذخائر</td></tr>
              ) : (
                data.ammunition.map((item, idx) => (
                  <tr key={idx} className={`border-b dark:border-gray-700 ${item.total <= item.minThreshold ? 'bg-red-50 dark:bg-red-900/30' : ''}`}>
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2">{item.caliber}</td>
                    <td className="px-4 py-2">{item.total}</td>
                    <td className="px-4 py-2">{item.headquarters}</td>
                    <td className="px-4 py-2">{item.platforms}</td>
                    <td className="px-4 py-2">{item.minThreshold}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;