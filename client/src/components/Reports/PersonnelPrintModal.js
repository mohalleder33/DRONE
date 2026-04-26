import React, { useState, useEffect } from 'react';
import { getPersonnelList } from '../../services/reportService';
import toast from 'react-hot-toast';

const PersonnelPrintModal = ({ location, platformId = null, courseId = null, onClose }) => {
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    const fetchPersonnel = async () => {
      setLoading(true);
      try {
        const res = await getPersonnelList(location, platformId, courseId);
        setPersonnel(res.data);
        
        // تعيين اسم الموقع للعرض
        if (location === 'general') setLocationName('جميع الكوادر');
        else if (location === 'headquarters') setLocationName('الرئاسة');
        else if (location === 'platform') setLocationName(`المنصة`);
        else if (location === 'courses') setLocationName('الدورات التدريبية');
      } catch (error) {
        toast.error('فشل تحميل قائمة الكوادر');
      } finally {
        setLoading(false);
      }
    };
    fetchPersonnel();
  }, [location, platformId, courseId]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>قائمة الكوادر - ${locationName}</title>
          <style>
            body { font-family: 'Tajawal', sans-serif; padding: 20px; margin: 0; }
            h2 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h2>قائمة الكوادر - ${locationName}</h2>
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الرتبة</th>
                <th>الرقم العسكري</th>
                <th>الحالة</th>
                <th>الموقع الحالي</th>
              </tr>
            </thead>
            <tbody>
              ${personnel.map(p => `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.rank}</td>
                  <td>${p.militaryId || '—'}</td>
                  <td>${p.attendanceStatus}</td>
                  <td>${p.currentLocation === 'headquarters' ? 'الرئاسة' : p.currentLocation}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-5xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            قائمة الكوادر - {locationName}
            {platformId && <span className="text-sm text-gray-500 mr-2">(المنصة)</span>}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">✕</button>
        </div>

        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : personnel.length === 0 ? (
          <div className="text-center py-8 text-gray-500">لا توجد كوادر</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="p-3 text-right">الاسم</th>
                    <th className="p-3 text-right">الرتبة</th>
                    <th className="p-3 text-right">الرقم العسكري</th>
                    <th className="p-3 text-right">الحالة</th>
                    <th className="p-3 text-right">الموقع الحالي</th>
                  </tr>
                </thead>
                <tbody>
                  {personnel.map(p => (
                    <tr key={p.id} className="border-t dark:border-gray-700">
                      <td className="p-3">{p.name}</td>
                      <td className="p-3">{p.rank}</td>
                      <td className="p-3">{p.militaryId || '—'}</td>
                      <td className="p-3">{p.attendanceStatus}</td>
                      <td className="p-3">{p.currentLocation === 'headquarters' ? 'الرئاسة' : p.currentLocation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 transition">
                إغلاق
              </button>
              <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                🖨️ طباعة
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PersonnelPrintModal;