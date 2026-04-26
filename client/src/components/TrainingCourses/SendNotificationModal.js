import React, { useState } from 'react';
import { sendNotificationToTrainees } from '../../services/trainingCourseService';
import toast from 'react-hot-toast';

const SendNotificationModal = ({ courseId, onClose }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => { if(!message.trim()) return toast.error('أدخل نص الإشعار'); setLoading(true); try { await sendNotificationToTrainees(courseId, message); toast.success('تم إرسال الإشعار'); onClose(); } catch(e){ toast.error('فشل الإرسال'); } finally { setLoading(false); } };
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 p-6 rounded w-96"><h3>إرسال إشعار للدارسين</h3><textarea placeholder="نص الإشعار" rows={4} value={message} onChange={(e)=>setMessage(e.target.value)} className="w-full border p-2 my-2 rounded" /><div className="flex justify-end gap-2"><button onClick={onClose}>إلغاء</button><button onClick={handleSubmit} disabled={loading}>إرسال</button></div></div></div>);
};
export default SendNotificationModal;