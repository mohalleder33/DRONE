import React, { useState, useEffect } from 'react';
import { uploadCourseFile, deleteCourseFile } from '../../services/trainingCourseService';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CourseFilesManager = ({ courseId }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fetchFiles = async () => { try { const res = await api.get(`/training-courses/${courseId}/files`); setFiles(res.data); } catch(e){} finally { setLoading(false); } };
  useEffect(() => { fetchFiles(); }, [courseId]);
  const handleUpload = async (e) => { const file = e.target.files[0]; if(!file) return; setUploading(true); try { await uploadCourseFile(courseId, file); toast.success('تم رفع الملف'); fetchFiles(); } catch(e){ toast.error('فشل الرفع'); } finally { setUploading(false); } };
  const handleDelete = async (id) => { if(window.confirm('حذف الملف؟')) try { await deleteCourseFile(courseId, id); toast.success('تم الحذف'); fetchFiles(); } catch(e){ toast.error('فشل الحذف'); } };
  if(loading) return <div>جاري تحميل الملفات...</div>;
  return (<div className="mt-4 border rounded p-4"><h4 className="font-semibold">ملفات الدورة</h4><div className="flex gap-2 mb-3"><label className="bg-blue-600 text-white px-3 py-1 rounded cursor-pointer text-sm">{uploading ? 'جاري الرفع...' : '+ رفع ملف'}<input type="file" onChange={handleUpload} className="hidden" /></label></div>{files.length===0 ? <p className="text-gray-500">لا توجد ملفات</p> : <ul className="list-disc list-inside text-sm">{files.map(f=><li key={f.id} className="flex justify-between items-center"><a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-600">{f.filename}</a><button onClick={()=>handleDelete(f.id)} className="text-red-600 text-xs">حذف</button></li>)}</ul>}</div>);
};
export default CourseFilesManager;