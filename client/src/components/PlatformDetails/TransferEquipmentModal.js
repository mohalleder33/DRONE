import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TransferEquipmentModal = ({ equipment, currentPlatformId, onClose, onSuccess }) => {
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatformId, setSelectedPlatformId] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => { const fetch = async () => { try { const res = await api.get('/platforms', { params: { limit: 100 } }); setPlatforms(res.data.data.filter(p=>p.id !== currentPlatformId)); } catch(e){ toast.error('فشل تحميل المنصات'); } }; fetch(); }, [currentPlatformId]);
  const handleTransfer = async () => { if(!selectedPlatformId) return toast.error('اختر المنصة'); setLoading(true); try { await api.post('/equipment/transfer', { equipmentId: equipment.id, fromPlatformId: currentPlatformId, toPlatformId: selectedPlatformId }); toast.success('تم نقل المعدة'); onSuccess(); onClose(); } catch(e){ toast.error('فشل النقل'); } finally { setLoading(false); } };
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96"><h3 className="text-xl font-bold mb-4">نقل {equipment.name}</h3><select value={selectedPlatformId} onChange={(e)=>setSelectedPlatformId(e.target.value)} className="w-full border p-2 mb-4 rounded"><option value="">اختر المنصة</option>{platforms.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><div className="flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">إلغاء</button><button onClick={handleTransfer} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">نقل</button></div></div></div>);
};
export default TransferEquipmentModal;