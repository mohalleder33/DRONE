import React, { useState, useEffect } from 'react';
import { getGlobalAmmunitionReport } from '../../services/reportService';
import toast from 'react-hot-toast';

const AmmunitionReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getGlobalAmmunitionReport();
        setData(res.data);
      } catch (error) {
        toast.error('فشل تحميل تقرير الذخائر');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div>جاري التحميل...</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">تقرير الذخائر العام</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead><tr><th>الصنف</th><th>الإجمالي</th><th>المستودع</th><th>المنصات</th><th>المستهلك/المعدوم</th><th>الحد الأدنى</th></tr></thead>
            <tbody>
              {data.items.map(item => (
                <tr key={item.id} className={item.total <= item.minThreshold ? 'bg-red-50' : ''}>
                  <td>{item.name}</td><td>{item.total}</td><td>{item.headquarters}</td><td>{item.platforms}</td><td>{item.scrapped || 0}</td><td>{item.minThreshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AmmunitionReport;