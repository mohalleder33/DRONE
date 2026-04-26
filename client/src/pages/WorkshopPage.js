import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWorkshopEquipment } from '../services/equipmentService';
import WorkshopEquipmentCard from '../components/Workshop/WorkshopEquipmentCard';
import ReturnFromWorkshopModal from '../components/Workshop/ReturnFromWorkshopModal';
import RetireFromWorkshopModal from '../components/Workshop/RetireFromWorkshopModal';
import EditFaultModal from '../components/Workshop/EditFaultModal';
import { can, ROLES } from '../utils/roleUtils';
import toast from 'react-hot-toast';

const WorkshopPage = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [modal, setModal] = useState({ type: null, item: null });

  // ✅ صلاحيات المستخدم
  const canReturn = can(user, 'return_from_workshop');
  const canRetire = can(user, 'delete');
  const canEditFault = user?.role === ROLES.ADMIN;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getWorkshopEquipment({ search, sourcePlatform: sourceFilter });
      setGroups(res.data);
    } catch (error) {
      toast.error('فشل تحميل بيانات الورشة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, sourceFilter]);

  const stats = {
    total: groups.reduce((acc, g) => acc + g.total, 0)
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الورشة</h1>
        <div className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
          عدد المعدات في الورشة: {stats.total}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="بحث بالاسم أو الموديل أو الرقم التسلسلي"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded p-2 dark:bg-gray-700 flex-1 min-w-[200px]"
        />
        <input
          type="text"
          placeholder="المنصة المصدر"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="border rounded p-2 dark:bg-gray-700 w-48"
        />
        <button onClick={fetchData} className="bg-blue-600 text-white px-4 py-2 rounded">تحديث</button>
      </div>

      {loading ? (
        <div className="text-center py-10">جاري التحميل...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-10 text-gray-500">لا توجد معدات في الورشة</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group, idx) => (
            <WorkshopEquipmentCard
              key={idx}
              group={group}
              userRole={user?.role}
              onReturn={(item) => canReturn && setModal({ type: 'return', item })}
              onRetire={(item) => canRetire && setModal({ type: 'retire', item })}
              onEditFault={(item) => canEditFault && setModal({ type: 'editFault', item })}
              onRefresh={fetchData}
            />
          ))}
        </div>
      )}

      {modal.type === 'return' && (
        <ReturnFromWorkshopModal
          equipment={modal.item}
          onClose={() => setModal({ type: null })}
          onSuccess={fetchData}
        />
      )}
      {modal.type === 'retire' && (
        <RetireFromWorkshopModal
          equipment={modal.item}
          onClose={() => setModal({ type: null })}
          onSuccess={fetchData}
        />
      )}
      {modal.type === 'editFault' && (
        <EditFaultModal
          equipment={modal.item}
          onClose={() => setModal({ type: null })}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default WorkshopPage;