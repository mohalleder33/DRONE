import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, ArrowPathIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';
import TransferEquipmentModal from './TransferEquipmentModal';
import ReturnEquipmentModal from './ReturnEquipmentModal';
import EditEquipmentModal from '../Equipment/EditEquipmentModal';

const EquipmentTab = ({ platformId, onRefresh }) => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transferModal, setTransferModal] = useState(null);
  const [returnModal, setReturnModal] = useState(null);
  const [editModal, setEditModal] = useState(null);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/platforms/${platformId}/equipment`);
      setEquipment(res.data);
    } catch (e) {
      toast.error('فشل التحميل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [platformId]);

  const handleDelete = async (id) => {
    if (window.confirm('حذف المعدة؟')) {
      try {
        await api.delete(`/equipment/${id}`);
        toast.success('تم الحذف');
        fetchEquipment();
      } catch (e) {
        toast.error('فشل الحذف');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={fetchEquipment}>
          <ArrowPathIcon className="h-5 w-5 text-blue-600" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="p-2">الاسم</th>
              <th className="p-2">الموديل</th>
              <th className="p-2">النوع</th>
              <th className="p-2">الرقم التسلسلي</th>
              <th className="p-2">الحالة</th>
              <th className="p-2">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center p-4">جاري التحميل...</td></tr>
            ) : (
              equipment.map(eq => (
                <tr key={eq.id} className="border-t dark:border-gray-700">
                  <td className="p-2">{eq.name}</td>
                  <td className="p-2">{eq.model}</td>
                  <td className="p-2">{eq.type}</td>
                  <td className="p-2">{eq.serialNumber}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${eq.status === 'جاهزة' ? 'bg-green-100' :
                        eq.status === 'موزعة' ? 'bg-blue-100' :
                          eq.status === 'في الصيانة' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>{eq.status}</span>
                  </td>
                  <td className="flex gap-2">
                    <button onClick={() => setEditModal(eq)}><PencilIcon className="h-4 w-4 text-blue-600" /></button>
                    <button onClick={() => handleDelete(eq.id)}><TrashIcon className="h-4 w-4 text-red-600" /></button>
                    <button onClick={() => setReturnModal(eq)}><ArrowLeftIcon className="h-4 w-4 text-green-600" /></button>
                    <button onClick={() => setTransferModal(eq)}><ArrowRightIcon className="h-4 w-4 text-yellow-600" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {transferModal && <TransferEquipmentModal equipment={transferModal} currentPlatformId={platformId} onClose={() => setTransferModal(null)} onSuccess={() => { fetchEquipment(); onRefresh(); }} />}
      {returnModal && <ReturnEquipmentModal equipment={returnModal} onClose={() => setReturnModal(null)} onSuccess={() => { fetchEquipment(); onRefresh(); }} />}
      {editModal && <EditEquipmentModal equipment={editModal} onClose={() => setEditModal(null)} onSuccess={() => { fetchEquipment(); onRefresh(); }} />}
    </div>
  );
};

export default EquipmentTab;