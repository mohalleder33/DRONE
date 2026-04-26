import React, { useState, useEffect } from 'react';
import { getGlobalEquipmentReport } from '../../services/reportService';
import PrintButton from './PrintButton';
import ExportExcelButton from './ExportExcelButton';
import ExportPDFButton from './ExportPDFButton';
import toast from 'react-hot-toast';

const EquipmentReport = () => {
  const [data, setData] = useState({
    headquarters: { total: 0, criticalThreshold: 0, retired: 0 },
    platforms: [],
    workshop: { total: 0, criticalThreshold: 0 },
    retired: { total: 0 },
    globalTotal: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getGlobalEquipmentReport();
        setData(res.data);
      } catch (error) {
        toast.error('فشل تحميل تقرير المعدات');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const exportData = [
    { الموقع: 'الرئاسة', العدد: data.headquarters.total, 'الحد الحرج': data.headquarters.criticalThreshold, 'خارج الخدمة': data.headquarters.retired },
    ...data.platforms.map(p => ({ الموقع: p.name, العدد: p.total, 'الحد الحرج': p.criticalThreshold, 'خارج الخدمة': p.retired || 0 })),
    { الموقع: 'الورشة', العدد: data.workshop.total, 'الحد الحرج': data.workshop.criticalThreshold, 'خارج الخدمة': '—' },
    { الموقع: 'الإجمالي', العدد: data.globalTotal, 'الحد الحرج': '—', 'خارج الخدمة': data.retired.total }
  ];

  if (loading) return <div className="text-center py-8">جاري تحميل التقرير...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">تقرير المعدات العام</h2>
        <div className="flex gap-2">
          <ExportExcelButton data={exportData} filename="equipment_global_report" />
          <ExportPDFButton data={exportData} title="تقرير المعدات العام" />
          <PrintButton targetId="equipment-report-content" />
        </div>
      </div>

      <div id="equipment-report-content" className="space-y-6">
        {/* الرئاسة */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="font-bold text-lg mb-3 text-blue-600">🏢 الرئاسة والمستودع الرئيسي</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-center">
              <div className="text-2xl font-bold">{data.headquarters.total}</div>
              <div className="text-sm">إجمالي المعدات</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded text-center">
              <div className="text-2xl font-bold text-yellow-700">{data.headquarters.criticalThreshold}</div>
              <div className="text-sm">الحد الحرج</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded text-center">
              <div className="text-2xl font-bold text-red-700">{data.headquarters.retired}</div>
              <div className="text-sm">خارج الخدمة</div>
            </div>
          </div>
        </div>

        {/* المنصات */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="font-bold text-lg mb-3 text-green-600">🚀 المعدات على المنصات</h3>
          {data.platforms.length === 0 ? (
            <p className="text-gray-500 text-center">لا توجد منصات</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr><th className="p-2 text-right">المنصة</th><th className="p-2 text-right">العدد</th><th className="p-2 text-right">الحد الحرج</th><th className="p-2 text-right">خارج الخدمة</th></tr>
                </thead>
                <tbody>
                  {data.platforms.map(p => (
                    <tr key={p.id} className="border-t dark:border-gray-700">
                      <td className="p-2">{p.name}</td>
                      <td className="p-2 font-semibold">{p.total}</td>
                      <td className="p-2 text-yellow-600">{p.criticalThreshold}</td>
                      <td className="p-2 text-red-600">{p.retired || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* الورشة */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="font-bold text-lg mb-3 text-orange-600">🔧 المعدات في الورشة</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded text-center">
              <div className="text-2xl font-bold text-orange-700">{data.workshop.total}</div>
              <div className="text-sm">قيد الصيانة</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded text-center">
              <div className="text-2xl font-bold text-yellow-700">{data.workshop.criticalThreshold}</div>
              <div className="text-sm">الحد الحرج لبقاء المعدة في الورشة</div>
            </div>
          </div>
        </div>

        {/* الإجمالي */}
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg shadow p-4 border-t-4 border-blue-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700">{data.globalTotal}</div>
              <div>إجمالي المعدات في النظام</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-700">{data.retired.total}</div>
              <div>إجمالي المعدات خارج الخدمة</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentReport;