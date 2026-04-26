import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { createAmmunition } from '../../services/ammunitionService';
import { AMMUNITION_TYPES } from '../../constants/ammunitionConstants';

const AddAmmunitionModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', caliber: '', type: 'خارقة', compatibleEquipment: '' });
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault(); if(!form.name || !form.caliber) return toast.error('الاسم والعيار مطلوبان');
    setLoading(true);
    try { await createAmmunition(form); toast.success('تمت الإضافة'); onSuccess(); onClose(); } catch(e){ toast.error('فشل الإضافة'); } finally { setLoading(false); }
  };
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 p-6 rounded w-96"><h2 className="text-xl font-bold mb-4">إضافة صنف جديد</h2><form onSubmit={handleSubmit}><input name="name" placeholder="الاسم *" onChange={handleChange} className="w-full border p-2 mb-2" required /><input name="caliber" placeholder="العيار *" onChange={handleChange} className="w-full border p-2 mb-2" required /><select name="type" onChange={handleChange} className="w-full border p-2 mb-2">{AMMUNITION_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select><input name="compatibleEquipment" placeholder="المعدات المتوافقة (اختياري)" onChange={handleChange} className="w-full border p-2 mb-2" /><div className="flex justify-end gap-2"><button type="button" onClick={onClose}>إلغاء</button><button type="submit" disabled={loading}>إضافة</button></div></form></div></div>);
};
export default AddAmmunitionModal;