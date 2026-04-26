import { useState, useEffect } from 'react';
import { getDashboardPersonnel, getDashboardEquipment, getDashboardAmmunition, getUpcomingRotations } from '../services/dashboardService';
import toast from 'react-hot-toast';

export const useDashboardData = () => {
  const [data, setData] = useState({
    personnel: { general: {}, headquarters: {}, platforms: [] },
    equipment: { total: 0, inHeadquarters: 0, inPlatforms: 0, inWorkshop: 0, retired: 0 },
    ammunition: [],  // ✅ Starts empty
    rotations: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [personnelRes, equipmentRes, ammoRes, rotationsRes] = await Promise.all([
          getDashboardPersonnel(),
          getDashboardEquipment(),
          getDashboardAmmunition(),
          getUpcomingRotations()
        ]);
        
              // ✅ أضف هذه الأسطر
 console.log('📊 Personnel Response:', JSON.stringify(personnelRes.data, null, 2));
console.log('📊 Equipment Response:', JSON.stringify(equipmentRes.data, null, 2));
      console.log('📊 Ammunition Response:', ammoRes.data);
      console.log('📊 Rotations Response:', rotationsRes.data);
      
        setData({
          personnel: personnelRes.data,
          equipment: equipmentRes.data,
          ammunition: ammoRes.data,  // ✅ Comes from server
          rotations: rotationsRes.data
        });
      } catch (error) {
        console.error('API Error:', error);
        toast.error('فشل تحميل بيانات لوحة التحكم');
        // ✅ NO FALLBACK DATA
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return { data, loading };
};