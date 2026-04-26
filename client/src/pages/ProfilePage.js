import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AccordionSection from '../components/Common/AccordionSection';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [openSections, setOpenSections] = useState({ info: true, password: false });
  const [formData, setFormData] = useState({ name: user?.name||'', rank: user?.rank||'', militaryId: user?.militaryId||'' });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProfile = async (e) => { e.preventDefault(); setLoading(true); const ok = await updateProfile(formData); setLoading(false); if(ok) toast.success('تم التحديث'); };
  const handlePassword = async (e) => { e.preventDefault(); if(newPassword!==confirmPassword) return toast.error('كلمة المرور غير متطابقة'); if(newPassword.length<6) return toast.error('كلمة المرور قصيرة'); setLoading(true); const ok = await changePassword(oldPassword, newPassword); setLoading(false); if(ok){ setOldPassword(''); setNewPassword(''); setConfirmPassword(''); } };

  return (<div className="p-4 md:p-6 space-y-6"><h1 className="text-2xl font-bold">ملفي الشخصي</h1><AccordionSection title="👤 المعلومات الأساسية" section="info" isOpen={openSections.info} onToggle={(s)=>setOpenSections(prev=>({...prev, [s]:!prev[s]}))}><form onSubmit={handleProfile}><label>الاسم</label><input type="text" value={formData.name} onChange={(e)=>setFormData({...formData, name:e.target.value})} className="w-full border p-2 mb-2 rounded" required /><label>الرتبة</label><input type="text" value={formData.rank} onChange={(e)=>setFormData({...formData, rank:e.target.value})} className="w-full border p-2 mb-2 rounded" /><label>الرقم العسكري</label><input type="text" value={formData.militaryId} onChange={(e)=>setFormData({...formData, militaryId:e.target.value})} className="w-full border p-2 mb-4 rounded" /><label>البريد الإلكتروني (للقراءة فقط)</label><input type="email" value={user?.email||''} disabled className="w-full border p-2 mb-4 rounded bg-gray-100" /><button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">حفظ التغييرات</button></form></AccordionSection><AccordionSection title="🔐 تغيير كلمة المرور" section="password" isOpen={openSections.password} onToggle={(s)=>setOpenSections(prev=>({...prev, [s]:!prev[s]}))}><form onSubmit={handlePassword}><input type="password" placeholder="كلمة المرور الحالية" value={oldPassword} onChange={(e)=>setOldPassword(e.target.value)} className="w-full border p-2 mb-2 rounded" required /><input type="password" placeholder="كلمة المرور الجديدة" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="w-full border p-2 mb-2 rounded" required /><input type="password" placeholder="تأكيد كلمة المرور" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className="w-full border p-2 mb-4 rounded" required /><button type="submit" disabled={loading} className="bg-yellow-600 text-white px-4 py-2 rounded">تغيير كلمة المرور</button></form></AccordionSection></div>);
};
export default ProfilePage;