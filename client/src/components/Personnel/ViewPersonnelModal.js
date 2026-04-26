import React, { useState, useEffect } from 'react';
import { getOfficerById, getNCOById, getRecruitById } from '../../services/personnelService';
import toast from 'react-hot-toast';

const ViewPersonnelModal = ({ personnel, type, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
 useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        // ✅ استخدام _id إذا كان موجوداً
        const id = personnel._id || personnel.id;
        if (!id) throw new Error('No ID');
        
        let res;
        if (type === 'officers') res = await getOfficerById(id);
        else if (type === 'ncos') res = await getNCOById(id);
        else res = await getRecruitById(id);
        setDetails(res.data);
      } catch (error) {
        toast.error('فشل تحميل التفاصيل');
        setDetails(personnel);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [personnel, type]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">تفاصيل {details?.name}</h2>
        <div className="grid grid-cols-2 gap-2"><div><strong>الرقم العسكري:</strong> {details?.militaryId || '—'}</div><div><strong>الرتبة:</strong> {details?.rank}</div><div><strong>التخصص:</strong> {details?.specialization || '—'}</div><div><strong>الوحدة:</strong> {details?.unit || '—'}</div><div><strong>الحالة:</strong> {details?.attendanceStatus}</div><div><strong>الموقع:</strong> {details?.currentLocation === 'headquarters' ? 'الرئاسة' : details?.currentLocation}</div></div>
        <div className="mt-4"><h3 className="font-bold">المهام العامة</h3><ul>{details?.tasks?.length ? details.tasks.map(t=><li key={t.id}>{t.name}</li>) : <li>لا توجد</li>}</ul></div>
        <div className="mt-4"><h3 className="font-bold">المأموريات</h3><ul>{details?.rotations?.length ? details.rotations.map(r=><li key={r.id}>{r.platform} - {new Date(r.startDate).toLocaleDateString()} إلى {new Date(r.endDate).toLocaleDateString()}</li>) : <li>لا توجد</li>}</ul></div>
        <div className="mt-4"><h3 className="font-bold">الدورات التدريبية</h3><ul>{details?.courses?.length ? details.courses.map(c=><li key={c.id}>{c.name} - {c.status}</li>) : <li>لا توجد</li>}</ul></div>
        <div className="flex justify-end mt-4"><button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">إغلاق</button></div>
      </div>
    </div>
  );
};
export default ViewPersonnelModal;