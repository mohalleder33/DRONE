import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { updateCourse, getCourseById, getAvailablePersonnel } from '../../services/trainingCourseService';
import { ChevronDownIcon, ChevronUpIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const EditCourseModal = ({ course, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    courseName: '',
    courseNumber: '',
    startDate: '',
    endDate: '',
    adminSupervisor: '',
    militarySupervisor: '',
    location: '',
    status: ''
  });

  const [availableOfficers, setAvailableOfficers] = useState([]);
  const [availableNCOs, setAvailableNCOs] = useState([]);
  const [availableRecruits, setAvailableRecruits] = useState([]);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(true);

  // Accordion for manual add
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualType, setManualType] = useState('officers');
  const [manualData, setManualData] = useState({
    name: '',
    rank: '',
    militaryId: '',
    specialization: '',
    unit: ''
  });

  // جلب بيانات الدورة والكوادر المتاحة
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, personnelRes] = await Promise.all([
          getCourseById(course.id || course._id),
          getAvailablePersonnel()
        ]);
        
        const courseData = courseRes.data;
        setForm({
          courseName: courseData.courseName || '',
          courseNumber: courseData.courseNumber || '',
          startDate: courseData.startDate ? courseData.startDate.split('T')[0] : '',
          endDate: courseData.endDate ? courseData.endDate.split('T')[0] : '',
          adminSupervisor: courseData.adminSupervisor || '',
          militarySupervisor: courseData.militarySupervisor || '',
          location: courseData.location || 'الرئاسة',
          status: courseData.status || 'قادمة'
        });
        
        // تحويل الدارسين إلى الصيغة المطلوبة
        const trainees = courseData.trainees?.map(t => ({
          id: t.id,
          name: t.name,
          rank: t.rank,
          militaryId: t.militaryId,
          specialization: t.specialization,
          unit: t.unit,
          type: t.type || (t.rank === 'عقيد' || t.rank === 'نقيب' ? 'officers' : 
                  t.rank === 'رقيب' ? 'ncos' : 'recruits'),
          isManual: t.isManual || false,
          grade: t.grade || 0,
          ranking: t.ranking || 0,
          attendance: t.attendance || 'حاضر'
        })) || [];
        setSelectedTrainees(trainees);
        
        const allPersonnel = personnelRes.data;
        setAvailableOfficers(allPersonnel.filter(p => p.type === 'officers'));
        setAvailableNCOs(allPersonnel.filter(p => p.type === 'ncos'));
        setAvailableRecruits(allPersonnel.filter(p => p.type === 'recruits'));
      } catch (error) {
        console.error('Error fetching course data:', error);
        toast.error('فشل تحميل بيانات الدورة');
      } finally {
        setLoadingCourse(false);
      }
    };
    fetchData();
  }, [course.id, course._id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addTraineeFromDB = (personnelId, type) => {
    let personnel = null;
    if (type === 'officers') personnel = availableOfficers.find(p => (p._id || p.id) === personnelId);
    else if (type === 'ncos') personnel = availableNCOs.find(p => (p._id || p.id) === personnelId);
    else personnel = availableRecruits.find(p => (p._id || p.id) === personnelId);

    if (personnel && !selectedTrainees.find(t => t.id === personnelId)) {
      setSelectedTrainees([
        ...selectedTrainees,
        {
          id: personnelId,
          name: personnel.name,
          rank: personnel.rank,
          militaryId: personnel.militaryId || '',
          specialization: personnel.specialization || '',
          unit: personnel.unit || '',
          type,
          isManual: false,
          grade: 0,
          ranking: selectedTrainees.length + 1,
          attendance: 'حاضر'
        }
      ]);
      toast.success(`تم إضافة ${personnel.name}`);
    } else {
      toast.error('الكادر موجود بالفعل في القائمة');
    }
  };

  const removeTrainee = (id) => {
    setSelectedTrainees(selectedTrainees.filter(t => t.id !== id));
  };

  const addManualTrainee = () => {
    if (!manualData.name || !manualData.rank) {
      toast.error('الاسم والرتبة مطلوبة');
      return;
    }
    const newId = Date.now().toString();
    setSelectedTrainees([
      ...selectedTrainees,
      {
        id: newId,
        name: manualData.name,
        rank: manualData.rank,
        militaryId: manualData.militaryId || '',
        specialization: manualData.specialization || '',
        unit: manualData.unit || '',
        type: manualType,
        isManual: true,
        grade: 0,
        ranking: selectedTrainees.length + 1,
        attendance: 'حاضر'
      }
    ]);
    setManualData({ name: '', rank: '', militaryId: '', specialization: '', unit: '' });
    setShowManualForm(false);
    toast.success('تمت إضافة الدارس يدوياً');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.courseName || !form.courseNumber || !form.startDate || !form.endDate) {
      toast.error('يرجى إكمال الحقول المطلوبة');
      return;
    }
    setLoading(true);
    try {
      await updateCourse(course.id || course._id, { ...form, trainees: selectedTrainees });
      toast.success('تم تحديث الدورة');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل تحديث الدورة');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCourse) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="text-center">جاري تحميل بيانات الدورة...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto z-50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">✏️ تعديل الدورة</h2>
          <form onSubmit={handleSubmit}>
            {/* الحقول الأساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input name="courseName" placeholder="اسم الدورة *" value={form.courseName} onChange={handleChange} className="border p-2 rounded dark:bg-gray-700" required />
              <input name="courseNumber" placeholder="رقم الدورة *" value={form.courseNumber} onChange={handleChange} className="border p-2 rounded dark:bg-gray-700" required />
              <input name="startDate" type="date" value={form.startDate} onChange={handleChange} className="border p-2 rounded dark:bg-gray-700" required />
              <input name="endDate" type="date" value={form.endDate} onChange={handleChange} className="border p-2 rounded dark:bg-gray-700" required />
              <input name="adminSupervisor" placeholder="المشرف الإداري" value={form.adminSupervisor} onChange={handleChange} className="border p-2 rounded dark:bg-gray-700" />
              <input name="militarySupervisor" placeholder="المشرف العسكري" value={form.militarySupervisor} onChange={handleChange} className="border p-2 rounded dark:bg-gray-700" />
              <input name="location" placeholder="الموقع" value={form.location} onChange={handleChange} className="border p-2 rounded dark:bg-gray-700" />
              <select name="status" value={form.status} onChange={handleChange} className="border p-2 rounded dark:bg-gray-700">
                <option value="قادمة">قادمة</option>
                <option value="جارية">جارية</option>
                <option value="منتهية">منتهية</option>
                <option value="ملغاة">ملغاة</option>
              </select>
            </div>

            {/* إدارة الدارسين - Accordion أنيق */}
            <div className="border rounded-lg overflow-hidden mb-4">
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 font-semibold flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5" /> إدارة الدارسين
              </div>
              
              {/* قسم الإضافة من قاعدة البيانات */}
              <div className="p-3 border-b">
                <h4 className="font-medium mb-2">📌 إضافة من قاعدة البيانات</h4>
                <div className="flex gap-2 mb-2">
                  {['officers', 'ncos', 'recruits'].map(role => (
                    <button
                      type="button"
                      key={role}
                      onClick={() => setManualType(role)}
                      className={`px-2 py-1 text-sm rounded ${manualType === role ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}
                    >
                      {role === 'officers' ? 'ضباط' : role === 'ncos' ? 'ضباط صف' : 'مستنفرين'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => addTraineeFromDB(e.target.value, manualType)}
                    className="border p-2 rounded flex-1 dark:bg-gray-700"
                  >
                    <option value="">اختر كادراً</option>
                    {(manualType === 'officers' ? availableOfficers : manualType === 'ncos' ? availableNCOs : availableRecruits).map(p => (
                      <option key={p._id || p.id} value={p._id || p.id}>{p.name} - {p.rank}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* قسم الإضافة اليدوية (قابل للطي) */}
              <div className="p-3 border-b">
                <button
                  type="button"
                  onClick={() => setShowManualForm(!showManualForm)}
                  className="flex justify-between items-center w-full text-right font-medium"
                >
                  <span>✏️ إضافة دارس يدوياً</span>
                  {showManualForm ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                </button>
                {showManualForm && (
                  <div className="mt-3 p-3 border rounded bg-gray-50 dark:bg-gray-800">
                    <select
                      value={manualType}
                      onChange={(e) => setManualType(e.target.value)}
                      className="border p-2 rounded w-full mb-2 dark:bg-gray-700"
                    >
                      <option value="officers">ضابط</option>
                      <option value="ncos">ضابط صف</option>
                      <option value="recruits">مستنفر</option>
                    </select>
                    <input
                      placeholder="الاسم الكامل *"
                      value={manualData.name}
                      onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
                      className="border p-2 rounded w-full mb-2 dark:bg-gray-700"
                    />
                    <input
                      placeholder="الرتبة *"
                      value={manualData.rank}
                      onChange={(e) => setManualData({ ...manualData, rank: e.target.value })}
                      className="border p-2 rounded w-full mb-2 dark:bg-gray-700"
                    />
                    <input
                      placeholder="الرقم العسكري (اختياري)"
                      value={manualData.militaryId}
                      onChange={(e) => setManualData({ ...manualData, militaryId: e.target.value })}
                      className="border p-2 rounded w-full mb-2 dark:bg-gray-700"
                    />
                    <input
                      placeholder="التخصص"
                      value={manualData.specialization}
                      onChange={(e) => setManualData({ ...manualData, specialization: e.target.value })}
                      className="border p-2 rounded w-full mb-2 dark:bg-gray-700"
                    />
                    <input
                      placeholder="الوحدة"
                      value={manualData.unit}
                      onChange={(e) => setManualData({ ...manualData, unit: e.target.value })}
                      className="border p-2 rounded w-full mb-2 dark:bg-gray-700"
                    />
                    <button
                      type="button"
                      onClick={addManualTrainee}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      إضافة الدارس
                    </button>
                  </div>
                )}
              </div>

              {/* قائمة الدارسين المختارين */}
              {selectedTrainees.length > 0 && (
                <div className="p-3">
                  <h4 className="font-medium mb-2">📋 الدارسون المضافون ({selectedTrainees.length})</h4>
                  <ul className="max-h-40 overflow-y-auto border rounded divide-y">
                    {selectedTrainees.map(t => (
                      <li key={t.id} className="flex justify-between items-center p-2">
                        <div>
                          <span className="font-medium">{t.name}</span> ({t.rank})
                          {t.isManual && <span className="text-xs text-gray-500 mr-2">(يدوي)</span>}
                          {t.grade > 0 && <span className="text-xs text-gray-500 mr-2">الدرجة: {t.grade}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTrainee(t.id)}
                          className="text-red-500 text-sm hover:text-red-700"
                        >
                          إزالة
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">إلغاء</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">حفظ التغييرات</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCourseModal;