import React from 'react';
import { EyeIcon, PencilIcon, TrashIcon, UserGroupIcon, ChartBarIcon, TagIcon, DocumentDuplicateIcon, BellIcon } from '@heroicons/react/24/outline';
import { getCourseStatusColor } from '../../constants/courseConstants';

const TrainingCourseCard = ({ course, userRole, onView, onEdit, onDelete, onStatusChange, onAttendance, onExport, onCopy, onNotify }) => {
  // ✅ استخراج المعرف بشكل صحيح
  const courseId = course?.id || course?._id;
  
  const can = (action) => {
    const role = userRole;
    if (action === 'edit' || action === 'delete' || action === 'status') {
      return role === 'admin' || role === 'commander';
    }
    if (action === 'attendance' || action === 'export') {
      return ['admin', 'commander', 'officer', 'supervisor'].includes(role);
    }
    if (action === 'copy' || action === 'notify') {
      return role === 'admin' || role === 'commander';
    }
    return true;
  };

  // ✅ التحقق من وجود المعرف قبل استدعاء الدوال
  const handleView = () => {
    if (!courseId) {
      console.error('Cannot view course: missing id', course);
      return;
    }
    if (onView) onView(course);
  };

  const handleEdit = () => {
    if (!courseId) {
      console.error('Cannot edit course: missing id', course);
      return;
    }
    if (onEdit) onEdit(course);
  };

  const handleDelete = () => {
    if (!courseId) {
      console.error('Cannot delete course: missing id', course);
      return;
    }
    if (onDelete) onDelete(courseId);
  };

  const handleStatusChange = () => {
    if (!courseId) {
      console.error('Cannot change status: missing id', course);
      return;
    }
    if (onStatusChange) onStatusChange(course);
  };

  const handleAttendance = () => {
    if (!courseId) {
      console.error('Cannot manage attendance: missing id', course);
      return;
    }
    if (onAttendance) onAttendance(course);
  };

  const handleExport = (format) => {
    if (!courseId) {
      console.error('Cannot export: missing id', course);
      return;
    }
    if (onExport) onExport(courseId, format);
  };

  const handleCopy = () => {
    if (!courseId) {
      console.error('Cannot copy course: missing id', course);
      return;
    }
    if (onCopy) onCopy(course);
  };

  const handleNotify = () => {
    if (!courseId) {
      console.error('Cannot send notification: missing id', course);
      return;
    }
    if (onNotify) onNotify(course);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-white">{course.courseName}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">رقم الدورة: {course.courseNumber}</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs ${getCourseStatusColor(course.status)}`}>
            {course.status}
          </span>
        </div>
      </div>
      
      <div className="p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">التاريخ:</span>
          <span className="text-gray-800 dark:text-white">
            {new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">المشرفون:</span>
          <span className="text-gray-800 dark:text-white">{course.adminSupervisor} / {course.militarySupervisor}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">عدد الدارسين:</span>
          <span className="text-gray-800 dark:text-white">{course.trainees?.length || 0}</span>
        </div>
      </div>
      
      {/* الصف الأول: الأزرار الأساسية */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-wrap gap-2 justify-center mb-2">
          <button onClick={handleView} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition">
            <EyeIcon className="h-4 w-4" /> عرض التفاصيل
          </button>
          {can('edit') && (
            <button onClick={handleEdit} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition">
              <PencilIcon className="h-4 w-4" /> تعديل
            </button>
          )}
          {can('delete') && (
            <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition">
              <TrashIcon className="h-4 w-4" /> حذف
            </button>
          )}
        </div>

        {/* الصف الثاني: أزرار إضافية */}
        <div className="flex flex-wrap gap-2 justify-center pt-1 border-t border-gray-200 dark:border-gray-700">
          {can('attendance') && (
            <button onClick={handleAttendance} className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
              <UserGroupIcon className="h-3 w-3" /> الحضور
            </button>
          )}
          {can('export') && (
            <>
              <button onClick={() => handleExport('excel')} className="text-green-600 text-xs hover:underline">Excel</button>
              <button onClick={() => handleExport('pdf')} className="text-red-600 text-xs hover:underline">PDF</button>
            </>
          )}
          {can('status') && (
            <button onClick={handleStatusChange} className="text-yellow-600 text-xs flex items-center gap-1 hover:underline">
              <TagIcon className="h-3 w-3" /> الحالة
            </button>
          )}
          {can('copy') && (
            <button onClick={handleCopy} className="text-purple-600 text-xs flex items-center gap-1 hover:underline">
              <DocumentDuplicateIcon className="h-3 w-3" /> نسخ
            </button>
          )}
          {can('notify') && (
            <button onClick={handleNotify} className="text-indigo-600 text-xs flex items-center gap-1 hover:underline">
              <BellIcon className="h-3 w-3" /> إشعار
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingCourseCard;