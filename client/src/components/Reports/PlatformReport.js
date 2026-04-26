import React, { useState, useEffect } from 'react';
import { getPlatformReport, getPlatformEquipment, getPlatformAmmunition, getPlatformsList } from '../../services/reportService';
import PrintButton from './PrintButton';
import ExportExcelButton from './ExportExcelButton';
import ExportPDFButton from './ExportPDFButton';
import PersonnelPrintModal from './PersonnelPrintModal';
import toast from 'react-hot-toast';

const PlatformReport = () => {
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [report, setReport] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [ammunition, setAmmunition] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPersonnelModal, setShowPersonnelModal] = useState(false);

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const res = await getPlatformsList();
        setPlatforms(res.data.data);
      } catch (error) {
        toast.error('فشل تحميل المنصات');
      }
    };
    fetchPlatforms();
  }, []);

  const fetchReport = async () => {
    if (!selectedPlatform) {
      toast.error('يرجى اختيار منصة');
      return;
    }
    setLoading(true);
    try {
      const [reportRes, equipRes, ammoRes] = await Promise.all([
        getPlatformReport(selectedPlatform),
        getPlatformEquipment(selectedPlatform),
        getPlatformAmmunition(selectedPlatform)
      ]);
      setReport(reportRes.data);
      setEquipment(equipRes.data);
      setAmmunition(ammoRes.data);
    } catch (error) {
      toast.error('فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!report) return [];
    const personnelStats = [
      { المقياس: 'القوة', القيمة: report.personnelStats?.power || 0 },
      { المقياس: 'التوزيعات', القيمة: report.personnelStats?.distribution || 0 },
      { المقياس: 'الموجود', القيمة: report.personnelStats?.present || 0 }
    ];
    const equipmentData = equipment.map(e => ({
      الاسم: e.name,
      الموديل: e.model,
      'الرقم التسلسلي': e.serialNumber,
      الحالة: e.status
    }));
    const ammunitionData = ammunition.map(a => ({
      الاسم: a.name,
      العيار: a.caliber,
      الكمية: a.quantity,
      'الحد الأدنى': a.minThreshold
    }));
    return { personnelStats, equipmentData, ammunitionData };
  };

  if (loading) return <div className="text-center py-8">جاري تحميل التقرير...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700"
        >
          <option value="">اختر المنصة</option>
          {platforms.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          onClick={fetchReport}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
        >
          عرض التقرير
        </button>
        {report && (
          <button
            onClick={() => setShowPersonnelModal(true)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm transition"
          >
            🖨️ طباعة كوادر المنصة
          </button>
        )}
      </div>

      {report && (
        <div id="platform-report-content" className="space-y-6">
          {/* معلومات المنصة */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{report.platformName}</h2>
            <p className="text-gray-600 dark:text-gray-400">الموقع: {report.location}</p>
            <p className="text-gray-600 dark:text-gray-400">الحالة: {report.status === 'active' ? 'فعالة' : 'معطلة'}</p>
          </div>

          {/* يومية المنصة */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-bold text-lg mb-3">يومية المنصة</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded text-center">
                <div className="text-2xl font-bold text-blue-800">{report.personnelStats?.power || 0}</div>
                <div className="text-sm">القوة</div>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded text-center">
                <div className="text-2xl font-bold text-yellow-800">{report.personnelStats?.distribution || 0}</div>
                <div className="text-sm">التوزيعات</div>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded text-center">
                <div className="text-2xl font-bold text-green-800">{report.personnelStats?.present || 0}</div>
                <div className="text-sm">الموجود</div>
              </div>
            </div>
          </div>

          {/* المعدات على المنصة */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-bold text-lg mb-3">المعدات على المنصة</h3>
            {equipment.length === 0 ? (
              <p className="text-gray-500 text-center">لا توجد معدات على هذه المنصة</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="p-2 text-right">الاسم</th>
                      <th className="p-2 text-right">الموديل</th>
                      <th className="p-2 text-right">الرقم التسلسلي</th>
                      <th className="p-2 text-right">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipment.map(e => (
                      <tr key={e.id} className="border-t dark:border-gray-700">
                        <td className="p-2">{e.name}</td>
                        <td className="p-2">{e.model}</td>
                        <td className="p-2">{e.serialNumber}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            e.status === 'جاهزة' ? 'bg-green-100 text-green-800' :
                            e.status === 'موزعة' ? 'bg-blue-100 text-blue-800' :
                            e.status === 'في الصيانة' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>{e.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* الذخائر على المنصة */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-bold text-lg mb-3">الذخائر على المنصة</h3>
            {ammunition.length === 0 ? (
              <p className="text-gray-500 text-center">لا توجد ذخائر على هذه المنصة</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="p-2 text-right">الاسم</th>
                      <th className="p-2 text-right">العيار</th>
                      <th className="p-2 text-right">الكمية</th>
                      <th className="p-2 text-right">الحد الأدنى</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ammunition.map(a => (
                      <tr key={a.id} className={`border-t dark:border-gray-700 ${a.quantity <= a.minThreshold ? 'bg-red-50 dark:bg-red-900/30' : ''}`}>
                        <td className="p-2">{a.name}</td>
                        <td className="p-2">{a.caliber}</td>
                        <td className="p-2 font-semibold">{a.quantity}</td>
                        <td className="p-2">{a.minThreshold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* أزرار التصدير والطباعة */}
          <div className="flex gap-2 justify-end">
            <ExportExcelButton data={exportData().equipmentData} filename={`platform_${report.platformName}_equipment`} />
            <ExportExcelButton data={exportData().ammunitionData} filename={`platform_${report.platformName}_ammunition`} />
            <ExportPDFButton data={[...exportData().personnelStats, ...exportData().equipmentData]} title={`تقرير منصة ${report.platformName}`} />
            <PrintButton targetId="platform-report-content" />
          </div>
        </div>
      )}

      {showPersonnelModal && (
        <PersonnelPrintModal
          location="platform"
          platformId={selectedPlatform}
          onClose={() => setShowPersonnelModal(false)}
        />
      )}
    </div>
  );
};

export default PlatformReport;