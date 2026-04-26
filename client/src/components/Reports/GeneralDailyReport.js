import React, { useState, useEffect } from 'react';
import { getGeneralDailyStats, getPersonnelList } from '../../services/reportService';
import PrintButton from './PrintButton';
import ExportExcelButton from './ExportExcelButton';
import ExportPDFButton from './ExportPDFButton';
import PersonnelPrintModal from './PersonnelPrintModal';
import toast from 'react-hot-toast';

const GeneralDailyReport = () => {
  const [stats, setStats] = useState({
    headquarters: { power: 0, distribution: 0, present: 0 },
    platforms: [],
    courses: { power: 0, distribution: 0, present: 0 },
    totals: { power: 0, distribution: 0, present: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [printLocation, setPrintLocation] = useState('general');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getGeneralDailyStats();
        setStats(res.data);
      } catch (error) {
        toast.error('فشل تحميل التقرير');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handlePrintPersonnel = (location, platformId = null, courseId = null) => {
    setPrintLocation({ location, platformId, courseId });
    setShowPersonnelModal(true);
  };

  const exportData = [
    { الوحدة: 'الرئاسة', القوة: stats.headquarters.power, التوزيعات: stats.headquarters.distribution, الموجود: stats.headquarters.present },
    ...stats.platforms.map(p => ({ الوحدة: p.name, القوة: p.power, التوزيعات: p.distribution, الموجود: p.present })),
    { الوحدة: 'الدورات التدريبية', القوة: stats.courses.power, التوزيعات: stats.courses.distribution, الموجود: stats.courses.present },
    { الوحدة: 'الإجمالي', القوة: stats.totals.power, التوزيعات: stats.totals.distribution, الموجود: stats.totals.present }
  ];

  if (loading) return <div className="text-center py-8">جاري تحميل التقرير...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">تقرير اليومية العامة</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => handlePrintPersonnel('general')} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition">
            🖨️ طباعة كل الكوادر
          </button>
          <ExportExcelButton data={exportData} filename="general_daily_report" />
          <ExportPDFButton data={exportData} title="التقرير اليومي العام" />
          <PrintButton targetId="general-report-content" />
        </div>
      </div>

      <div id="general-report-content" className="space-y-6">
        {/* الرئاسة */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">📍 الرئاسة</h3>
            <button onClick={() => handlePrintPersonnel('headquarters')} className="text-blue-600 text-sm hover:underline">
              طباعة الكوادر
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded text-center">
              <div className="text-2xl font-bold text-blue-800">{stats.headquarters.power}</div>
              <div className="text-sm">القوة</div>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded text-center">
              <div className="text-2xl font-bold text-yellow-800">{stats.headquarters.distribution}</div>
              <div className="text-sm">التوزيعات</div>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded text-center">
              <div className="text-2xl font-bold text-green-800">{stats.headquarters.present}</div>
              <div className="text-sm">الموجود</div>
            </div>
          </div>
        </div>

        {/* المنصات */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="font-bold text-lg mb-3">📍 المنصات</h3>
          <div className="space-y-4">
            {stats.platforms.map(platform => (
              <div key={platform.id} className="border-b pb-3 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">{platform.name}</h4>
                  <button onClick={() => handlePrintPersonnel('platform', platform.id)} className="text-blue-600 text-sm hover:underline">
                    طباعة الكوادر
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded text-center">
                    <span className="font-bold">{platform.power}</span>
                    <div className="text-xs">القوة</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 p-2 rounded text-center">
                    <span className="font-bold">{platform.distribution}</span>
                    <div className="text-xs">التوزيعات</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded text-center">
                    <span className="font-bold">{platform.present}</span>
                    <div className="text-xs">الموجود</div>
                  </div>
                </div>
              </div>
            ))}
            {stats.platforms.length === 0 && <p className="text-gray-500 text-center">لا توجد منصات</p>}
          </div>
        </div>

        {/* الدورات التدريبية */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">📚 الدورات التدريبية</h3>
            <button onClick={() => handlePrintPersonnel('courses')} className="text-blue-600 text-sm hover:underline">
              طباعة الكوادر
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded text-center">
              <div className="text-2xl font-bold text-blue-800">{stats.courses.power}</div>
              <div className="text-sm">القوة</div>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded text-center">
              <div className="text-2xl font-bold text-yellow-800">{stats.courses.distribution}</div>
              <div className="text-sm">التوزيعات</div>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded text-center">
              <div className="text-2xl font-bold text-green-800">{stats.courses.present}</div>
              <div className="text-sm">الموجود</div>
            </div>
          </div>
        </div>

        {/* الإجمالي */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-t-4 border-blue-500">
          <h3 className="font-bold text-lg mb-3">📊 الإجمالي العام</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-200 dark:bg-blue-800 p-3 rounded text-center">
              <div className="text-2xl font-bold">{stats.totals.power}</div>
              <div className="text-sm">إجمالي القوة</div>
            </div>
            <div className="bg-yellow-200 dark:bg-yellow-800 p-3 rounded text-center">
              <div className="text-2xl font-bold">{stats.totals.distribution}</div>
              <div className="text-sm">إجمالي التوزيعات</div>
            </div>
            <div className="bg-green-200 dark:bg-green-800 p-3 rounded text-center">
              <div className="text-2xl font-bold">{stats.totals.present}</div>
              <div className="text-sm">إجمالي الموجود</div>
            </div>
          </div>
        </div>
      </div>

      {showPersonnelModal && (
        <PersonnelPrintModal
          location={printLocation.location}
          platformId={printLocation.platformId}
          courseId={printLocation.courseId}
          onClose={() => setShowPersonnelModal(false)}
        />
      )}
    </div>
  );
};

export default GeneralDailyReport;