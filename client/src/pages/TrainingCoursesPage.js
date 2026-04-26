import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCourses, deleteCourse, exportCourseReport } from '../services/trainingCourseService';
import TrainingCourseCard from '../components/TrainingCourses/TrainingCourseCard';
import AddCourseModal from '../components/TrainingCourses/AddCourseModal';
import EditCourseModal from '../components/TrainingCourses/EditCourseModal';
import CourseDetailsModal from '../components/TrainingCourses/CourseDetailsModal';
import TraineeAttendanceModal from '../components/TrainingCourses/TraineeAttendanceModal';
import UpdateCourseStatusModal from '../components/TrainingCourses/UpdateCourseStatusModal';
import CopyCourseModal from '../components/TrainingCourses/CopyCourseModal';
import SendNotificationModal from '../components/TrainingCourses/SendNotificationModal';
import { can, ROLES } from '../utils/roleUtils';
import toast from 'react-hot-toast';

const TrainingCoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '', startDate: '', endDate: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // ✅ صلاحيات المستخدم
  const canManageCourses = can(user, 'manage_courses');
  const canCreate = can(user, 'create');
  const canEdit = can(user, 'update');
  const canDelete = can(user, 'delete');
  const canExport = can(user, 'print_report');
  const isAdmin = user?.role === ROLES.ADMIN;

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await getCourses(pagination.page, pagination.limit, filters);
      setCourses(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error('فشل تحميل الدورات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [pagination.page, filters]);

  const handleDelete = async (courseId) => {
    if (!canDelete) {
      toast.error('غير مصرح بحذف الدورات');
      return;
    }
    if (window.confirm('هل أنت متأكد من حذف هذه الدورة؟')) {
      try {
        await deleteCourse(courseId);
        toast.success('تم حذف الدورة');
        fetchCourses();
      } catch (error) {
        toast.error('فشل الحذف');
      }
    }
  };

  const handleExport = async (courseId, format) => {
    if (!canExport) {
      toast.error('غير مصرح بتصدير التقارير');
      return;
    }
    try {
      const res = await exportCourseReport(courseId, format);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `course_${courseId}_report.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('تم التصدير');
    } catch (error) {
      toast.error('فشل التصدير');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الدورات التدريبية</h1>
        {canCreate && (
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md">
            + دورة جديدة
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input type="text" placeholder="بحث (اسم أو رقم الدورة)" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} className="border rounded p-2" />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })} className="border rounded p-2">
          <option value="">جميع الحالات</option>
          <option value="قادمة">قادمة</option>
          <option value="جارية">جارية</option>
          <option value="منتهية">منتهية</option>
          <option value="ملغاة">ملغاة</option>
        </select>
        <input type="date" placeholder="من تاريخ" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })} className="border rounded p-2" />
        <input type="date" placeholder="إلى تاريخ" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })} className="border rounded p-2" />
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="text-center py-10">جاري التحميل...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-10 text-gray-500">لا توجد دورات</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <TrainingCourseCard
              key={course._id || course.id}
              course={course}
              userRole={user?.role}
              onView={(c) => { setSelectedCourse(c); setShowDetailsModal(true); }}
              onEdit={(c) => { if (canEdit) { setSelectedCourse(c); setShowEditModal(true); } }}
              onDelete={(id) => handleDelete(id)}
              onStatusChange={(c) => { if (isAdmin) { setSelectedCourse(c); setShowStatusModal(true); } }}
              onAttendance={(c) => { if (canManageCourses) { setSelectedCourse(c); setShowAttendanceModal(true); } }}
              onExport={(id, format) => handleExport(id, format)}
              onCopy={(c) => { if (canCreate) { setSelectedCourse(c); setShowCopyModal(true); } }}
              onNotify={(c) => { setSelectedCourse(c); setShowNotifyModal(true); }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button disabled={pagination.page === 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50">السابق</button>
        <span>صفحة {pagination.page} من {pagination.pages}</span>
        <button disabled={pagination.page === pagination.pages} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50">التالي</button>
      </div>

      {/* Modals */}
      {showAddModal && <AddCourseModal onClose={() => setShowAddModal(false)} onSuccess={fetchCourses} />}
      {showEditModal && selectedCourse && <EditCourseModal course={selectedCourse} onClose={() => setShowEditModal(false)} onSuccess={fetchCourses} />}
      {showDetailsModal && selectedCourse && <CourseDetailsModal course={selectedCourse} onClose={() => setShowDetailsModal(false)} onRefresh={fetchCourses} />}
      {showAttendanceModal && selectedCourse && <TraineeAttendanceModal course={selectedCourse} onClose={() => setShowAttendanceModal(false)} onRefresh={fetchCourses} />}
      {showStatusModal && selectedCourse && <UpdateCourseStatusModal course={selectedCourse} onClose={() => setShowStatusModal(false)} onSuccess={fetchCourses} />}
      {showCopyModal && selectedCourse && <CopyCourseModal course={selectedCourse} onClose={() => setShowCopyModal(false)} onSuccess={fetchCourses} />}
      {showNotifyModal && selectedCourse && <SendNotificationModal courseId={selectedCourse._id || selectedCourse.id} courseName={selectedCourse.courseName} onClose={() => setShowNotifyModal(false)} />}
    </div>
  );
};

export default TrainingCoursesPage;