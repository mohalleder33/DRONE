import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PrintButton from './PrintButton';
import ExportExcelButton from './ExportExcelButton';
import ExportPDFButton from './ExportPDFButton';
import PersonnelPrintModal from './PersonnelPrintModal';
import toast from 'react-hot-toast';

const HeadquartersReport = () => {
  const [stats, setStats] = useState({ power: 0, distribution: 0, present: 0 });
  const [equipment, setEquipment] = useState({ total: 0, inWarehouse: 0, inWorkshop: 0, retired: 0 });
  const [ammunition, setAmmunition] = useState({ total: 0, byType: [] });
  const [loading, setLoading] = useState(false);
  const [showPersonnelModal, setShowPersonnelModal] = useState(false);

  // ✅ إنشاء نسخة من axios مع التوكن
  const getApiWithToken = () => {
    const token = localStorage.getItem('token');
    console.log('🔑 Token found:', !!token);
    
    return axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const api = getApiWithToken();
      
      try {
        console.log('📡 Fetching headquarters report...');
        
        const [statsRes, equipRes, ammoRes] = await Promise.all([
          api.get('/reports/headquarters'),
          api.get('/reports/equipment', { params: { location: 'headquarters' } }),
          api.get('/reports/ammunition', { params: { location: 'headquarters' } })
        ]);
        
        console.log('📊 Stats Response:', statsRes.data);
        console.log('🔧 Equipment Response:', equipRes.data);
        console.log('💣 Ammunition Response:', ammoRes.data);
        
        setStats(statsRes.data.personnelStats || { power: 0, distribution: 0, present: 0 });
        setEquipment(equipRes.data.equipment || { total: 0, inWarehouse: 0, inWorkshop: 0, retired: 0 });
        setAmmunition(ammoRes.data.ammunition || { total: 0, byType: [] });
        
      } catch (error) {
        console.error('❌ Error fetching report:', error);
        console.error('Error response:', error.response?.data);
        toast.error(`فشل تحميل تقرير الرئاسة: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-8">جاري التحميل...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">تقرير الرئاسة</h2>
        <button 
          onClick={() => setShowPersonnelModal(true)} 
          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm transition"
        >
          🖨️ طباعة كوادر الرئاسة
        </button>
      </div>

      <div id="headquarters-report-content" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
        {/* Personnel Stats */}
        <div>
          <h3 className="font-bold text-lg mb-3 text-blue-600">📊 إحصائيات الكوادر</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-800">{stats.power}</div>
              <div className="text-sm">القوة</div>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-yellow-800">{stats.distribution}</div>
              <div className="text-sm">التوزيعات</div>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-800">{stats.present}</div>
              <div className="text-sm">الموجود</div>
            </div>
          </div>
        </div>

        {/* Equipment Stats */}
        <div>
          <h3 className="font-bold text-lg mb-3 text-green-600">🔧 وضع المعدات في المستودع</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-center">
              <span className="font-bold text-xl">{equipment.total || 0}</span>
              <div className="text-sm">إجمالي المعدات</div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded text-center">
              <span className="font-bold text-xl">{equipment.inWarehouse || 0}</span>
              <div className="text-sm">في المستودع</div>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded text-center">
              <span className="font-bold text-xl">{equipment.inWorkshop || 0}</span>
              <div className="text-sm">في الصيانة</div>
            </div>
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded text-center">
              <span className="font-bold text-xl">{equipment.retired || 0}</span>
              <div className="text-sm">خارج الخدمة</div>
            </div>
          </div>
        </div>

        {/* Ammunition Stats */}
        <div>
          <h3 className="font-bold text-lg mb-3 text-purple-600">💣 وضع الذخائر في المستودع</h3>
          {ammunition.byType?.length === 0 ? (
            <div className="text-center text-gray-500 py-4">لا توجد ذخائر في المستودع</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="p-2 text-right">الصنف</th>
                    <th className="p-2 text-right">الكمية</th>
                    <th className="p-2 text-right">الحد الأدنى</th>
                  </tr>
                </thead>
                <tbody>
                  {ammunition.byType?.map((item, idx) => (
                    <tr key={idx} className={`border-t ${item.quantity <= item.minThreshold ? 'bg-red-50 dark:bg-red-900/30' : ''}`}>
                      <td className="p-2">{item.name}</td>
                      <td className="p-2 font-semibold">{item.quantity}</td>
                      <td className="p-2">{item.minThreshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showPersonnelModal && (
        <PersonnelPrintModal 
          location="headquarters" 
          onClose={() => setShowPersonnelModal(false)} 
        />
      )}
    </div>
  );
};

export default HeadquartersReport;