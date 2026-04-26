import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { distributeEquipment } from '../../services/equipmentService';
import api from '../../services/api';

const DistributeEquipmentModal = ({ equipment, onClose, onSuccess }) => {
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => { const fetch = async () => { try { const res = await api.get('/platforms', { params: { limit: 100, status: 'active' } }); setPlatforms(res.data.data); } catch(e){ toast.error('فشل تحميل المنصات'); } }; fetch(); }, []);
  const handleSubmit = async () => { if(!selectedPlatform) return toast.error('اختر المنصة'); setLoading(true); try { await distributeEquipment(equipment.id, selectedPlatform); toast.success('تم التوزيع'); onSuccess(); onClose(); } catch(e){ toast.error('فشل التوزيع'); } finally { setLoading(false); } };
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 p-6 rounded w-96"><h3>توزيع المعدة</h3><p>{equipment.name} - {equipment.serialNumber}</p><select value={selectedPlatform} onChange={(e)=>setSelectedPlatform(e.target.value)} className="w-full border p-2 my-2"><option value="">اختر المنصة</option>{platforms.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}</select><div className="flex justify-end gap-2"><button onClick={onClose}>إلغاء</button><button onClick={handleSubmit} disabled={loading}>توزيع</button></div></div></div>);
};
export default DistributeEquipmentModal;