import React, { useState, useEffect } from 'react';
import { getCourseById, removeTrainee, updateTraineeGrade, updateTraineeAttendance } from '../../services/trainingCourseService';
import toast from 'react-hot-toast';
import AddTraineeModal from './AddTraineeModal';
import EditTraineeModal from './EditTraineeModal';
import CertificatePDF from './CertificatePDF';
import SendNotificationModal from './SendNotificationModal';
import CourseFilesManager from './CourseFilesManager';
import { ATTENDANCE_OPTIONS } from '../../constants/courseConstants';

const CourseDetailsModal = ({ course, onClose, onRefresh }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showAddTrainee, setShowAddTrainee] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState(null);
  const [showNotif, setShowNotif] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  // ✅ الحصول على معرف الدورة بشكل صحيح
  const courseId = course?.id || course?._id;

  useEffect(() => {
    const fetchDetails = async () => {
      // ✅ التحقق من وجود معرف الدورة قبل جلب البيانات
      if (!courseId) {
        console.error('Cannot fetch course details: missing course ID', course);
        toast.error('معرف الدورة غير صالح');
        return;
      }
      
      setLoading(true);
      try {
        const res = await getCourseById(courseId);
        setDetails(res.data);
      } catch (error) {
        console.error('Error fetching course details:', error);
        toast.error('فشل تحميل تفاصيل الدورة');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [courseId, course]);

  const handleRemove = async (traineeId) => {
    if (!courseId) {
      toast.error('معرف الدورة غير صالح');
      return;
    }
    if (window.confirm('هل أنت متأكد من إزالة هذا الدارس؟')) {
      try {
        await removeTrainee(courseId, traineeId);
        toast.success('تمت الإزالة');
        const res = await getCourseById(courseId);
        setDetails(res.data);
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Error removing trainee:', error);
        toast.error('فشل الإزالة');
      }
    }
  };

  const handleUpdate = async (traineeId, grade, ranking, attendance) => {
    if (!courseId) {
      toast.error('معرف الدورة غير صالح');
      return;
    }
    try {
      if (grade !== undefined && ranking !== undefined) {
        await updateTraineeGrade(courseId, traineeId, grade, ranking);
      }
      if (attendance) {
        await updateTraineeAttendance(courseId, traineeId, attendance);
      }
      toast.success('تم التحديث');
      const res = await getCourseById(courseId);
      setDetails(res.data);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating trainee:', error);
      toast.error('فشل التحديث');
    }
  };

  const moveRank = (trainee, direction) => {
    if (!details?.trainees) return;
    const trainees = [...details.trainees];
    const idx = trainees.findIndex(t => t.id === trainee.id);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= trainees.length) return;
    [trainees[idx], trainees[newIdx]] = [trainees[newIdx], trainees[idx]];
    const updates = trainees.map((t, i) => updateTraineeGrade(courseId, t.id, t.grade, i + 1));
    Promise.all(updates).then(() => {
      toast.success('تم تحديث الترتيب');
      getCourseById(courseId).then(res => setDetails(res.data));
    }).catch(() => toast.error('فشل تحديث الترتيب'));
  };

  const getFilteredTrainees = () => {
    if (!details?.trainees) return [];
    if (activeTab === 'all') return details.trainees;
    return details.trainees.filter(t => {
      if (activeTab === 'officers') return t.type === 'officers';
      if (activeTab === 'ncos') return t.type === 'ncos';
      return t.type === 'recruits';
    });
  };

  if (!courseId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
          <h3 className="text-xl font-bold mb-4 text-red-600">خطأ</h3>
          <p>معرف الدورة غير صالح</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-300 rounded">إغلاق</button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-center p-4">جاري التحميل...</div>;
  if (!details) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto z-50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{details.courseName}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">رقم الدورة: {details.courseNumber}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
          </div>

          {/* Course Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm my-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div><strong>التاريخ:</strong> {new Date(details.startDate).toLocaleDateString()} - {new Date(details.endDate).toLocaleDateString()}</div>
            <div><strong>المشرف الإداري:</strong> {details.adminSupervisor || '—'}</div>
            <div><strong>المشرف العسكري:</strong> {details.militarySupervisor || '—'}</div>
            <div><strong>الموقع:</strong> {details.location}</div>
            <div><strong>الحالة:</strong> <span className={`px-2 py-1 rounded text-xs ${
              details.status === 'قادمة' ? 'bg-blue-100 text-blue-800' : 
              details.status === 'جارية' ? 'bg-green-100 text-green-800' : 
              details.status === 'منتهية' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
            }`}>{details.status}</span></div>
            <div><strong>عدد الدارسين:</strong> {details.trainees?.length || 0}</div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => setShowAddTrainee(true)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">+ إضافة دارس</button>
            <button onClick={() => setShowNotif(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm">📢 إرسال إشعار</button>
            <button onClick={() => setShowFiles(!showFiles)} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm">📁 ملفات الدورة</button>
          </div>

          {showFiles && <CourseFilesManager courseId={courseId} />}

          {/* Tabs for Trainees */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mt-4">
            <button onClick={() => setActiveTab('all')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>جميع الدارسين</button>
            <button onClick={() => setActiveTab('officers')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'officers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>الضباط</button>
            <button onClick={() => setActiveTab('ncos')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'ncos' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>ضباط الصف</button>
            <button onClick={() => setActiveTab('recruits')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'recruits' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>المستنفرين</button>
          </div>

{/* Trainees Table */}
<div className="overflow-x-auto mt-4">
  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
    <thead className="bg-gray-50 dark:bg-gray-700">
      <tr>
        <th className="px-4 py-2 text-right">الاسم</th>
        <th className="px-4 py-2 text-right">الرتبة</th>
        <th className="px-4 py-2 text-right">الدرجة</th>
        <th className="px-4 py-2 text-right">الترتيب</th>
        <th className="px-4 py-2 text-right">الحضور</th>
        <th className="px-4 py-2 text-right">الإجراءات</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
      {getFilteredTrainees().map((t, idx) => (
        <tr key={t.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
          <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{t.name}</td>
          <td className="px-4 py-2 text-gray-800 dark:text-white">{t.rank}</td>
          <td className="px-4 py-2">
            <input 
              type="number" 
              defaultValue={t.grade} 
              onBlur={(e) => handleUpdate(t.id, parseInt(e.target.value), t.ranking, null)} 
              className="w-16 border rounded p-1 text-center dark:bg-gray-700 dark:border-gray-600" 
            />
          </td>
          <td className="px-4 py-2">
            <div className="flex items-center gap-1">
              <span className="text-gray-800 dark:text-white">{t.ranking}</span>
              <button 
                onClick={() => moveRank(t, 'up')} 
                className="text-blue-600 hover:text-blue-800 transition" 
                title="رفع الترتيب"
              >
                ↑
              </button>
              <button 
                onClick={() => moveRank(t, 'down')} 
                className="text-blue-600 hover:text-blue-800 transition" 
                title="خفض الترتيب"
              >
                ↓
              </button>
            </div>
          </td>
          <td className="px-4 py-2">
            <select 
              defaultValue={t.attendance} 
              onChange={(e) => handleUpdate(t.id, t.grade, t.ranking, e.target.value)} 
              className="border rounded p-1 text-sm dark:bg-gray-700 dark:border-gray-600"
            >
              {ATTENDANCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </td>
          <td className="px-4 py-2">
            <div className="flex gap-2">
              <button 
                onClick={() => setEditingTrainee(t)} 
                className="text-blue-600 hover:text-blue-800 transition" 
                title="تعديل"
              >
                ✏️
              </button>
              <button 
                onClick={() => handleRemove(t.id)} 
                className="text-red-600 hover:text-red-800 transition" 
                title="إزالة"
              >
                🗑️
              </button>
              <CertificatePDF course={details} trainee={t} />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

          <div className="flex justify-end mt-4">
            <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400 transition">إغلاق</button>
          </div>

          {/* Modals */}
          {showAddTrainee && <AddTraineeModal courseId={courseId} onClose={() => setShowAddTrainee(false)} onSuccess={() => { getCourseById(courseId).then(res => setDetails(res.data)); if (onRefresh) onRefresh(); }} />}
          {editingTrainee && <EditTraineeModal trainee={editingTrainee} onClose={() => setEditingTrainee(null)} onSave={(grade, ranking, attendance) => handleUpdate(editingTrainee.id, grade, ranking, attendance)} />}
          {showNotif && <SendNotificationModal courseId={courseId} onClose={() => setShowNotif(false)} />}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsModal;