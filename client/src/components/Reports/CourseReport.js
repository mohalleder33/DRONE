import React, { useState, useEffect } from 'react';
import { getCourseReport, getCoursesList } from '../../services/reportService';
import PrintButton from './PrintButton';
import ExportExcelButton from './ExportExcelButton';
import ExportPDFButton from './ExportPDFButton';
import toast from 'react-hot-toast';

const CourseReport = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await getCoursesList();
        const coursesData = res.data?.data || res.data || [];
        setCourses(coursesData);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('فشل تحميل الدورات');
      }
    };
    fetchCourses();
  }, []);

  const fetchReport = async () => {
    if (!selectedCourse || selectedCourse === 'undefined') {
      toast.error('يرجى اختيار دورة صالحة');
      return;
    }

    setLoading(true);
    try {
      const res = await getCourseReport(selectedCourse);
      setReport(res.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const getCourseStats = () => {
    if (!report || !report.trainees) {
      return { power: 0, distribution: 0, present: 0 };
    }
    const trainees = report.trainees;
    const power = trainees.length;
    const distribution = trainees.filter(t => t.attendance !== 'حاضر').length;
    const present = trainees.filter(t => t.attendance === 'حاضر').length;
    return { power, distribution, present };
  };

  const stats = getCourseStats();

  const exportData = () => {
    if (!report) return [];
    return report.trainees?.map(t => ({
      الاسم: t.name,
      الرتبة: t.rank,
      'الرقم العسكري': t.militaryId || '—',
      الدرجة: t.grade,
      الترتيب: t.ranking,
      الحضور: t.attendance
    })) || [];
  };

  if (loading) {
    return <div className="text-center py-8">جاري تحميل التقرير...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700"
        >
          <option value="">اختر الدورة</option>
          {courses.map(c => (
            <option key={c._id || c.id} value={c._id || c.id}>
              {c.courseName} ({c.courseNumber})
            </option>
          ))}
        </select>
        <button
          onClick={fetchReport}
          disabled={!selectedCourse}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition disabled:opacity-50"
        >
          عرض التقرير
        </button>
      </div>

      {report && (
        <div id="course-report-content" className="space-y-6">
          {/* معلومات الدورة */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {report.courseName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  رقم الدورة: {report.courseNumber}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  report.status === 'قادمة'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : report.status === 'جارية'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : report.status === 'منتهية'
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {report.status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm">
              <p>
                <strong>التاريخ:</strong> {new Date(report.startDate).toLocaleDateString()} -{' '}
                {new Date(report.endDate).toLocaleDateString()}
              </p>
              <p>
                <strong>الموقع:</strong> {report.location}
              </p>
              <p>
                <strong>المشرف الإداري:</strong> {report.adminSupervisor || '—'}
              </p>
              <p>
                <strong>المشرف العسكري:</strong> {report.militarySupervisor || '—'}
              </p>
            </div>
          </div>

          {/* يومية الدورة */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-bold text-lg mb-3">يومية الدورة</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded text-center">
                <div className="text-2xl font-bold text-blue-800">{stats.power}</div>
                <div className="text-sm">القوة (عدد الدارسين)</div>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded text-center">
                <div className="text-2xl font-bold text-yellow-800">{stats.distribution}</div>
                <div className="text-sm">التوزيعات (غائب/بعذر)</div>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded text-center">
                <div className="text-2xl font-bold text-green-800">{stats.present}</div>
                <div className="text-sm">الموجود (حاضر)</div>
              </div>
            </div>
          </div>

          {/* جدول الدارسين */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <h3 className="font-bold text-lg p-4 border-b">قائمة الدارسين</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="p-3 text-right">الاسم</th>
                    <th className="p-3 text-right">الرتبة</th>
                    <th className="p-3 text-right">الرقم العسكري</th>
                    <th className="p-3 text-right">الدرجة</th>
                    <th className="p-3 text-right">الترتيب</th>
                    <th className="p-3 text-right">الحضور</th>
                  </tr>
                </thead>
                <tbody>
                  {report.trainees?.map((t, index) => (
                    <tr key={t.id || index} className="border-t dark:border-gray-700">
                      <td className="p-3 font-medium">{t.name}</td>
                      <td className="p-3">{t.rank}</td>
                      <td className="p-3">{t.militaryId || '—'}</td>
                      <td className="p-3">{t.grade}</td>
                      <td className="p-3">{t.ranking}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            t.attendance === 'حاضر'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : t.attendance === 'غائب'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {t.attendance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <td colSpan="6" className="p-3 text-center text-gray-600 dark:text-gray-400">
                      إجمالي الدارسين: {report.trainees?.length || 0}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* أزرار التصدير والطباعة */}
          <div className="flex gap-2 justify-end">
            <ExportExcelButton
              data={exportData()}
              filename={`course_${report.courseNumber}_report`}
            />
            <ExportPDFButton
              data={exportData()}
              title={`تقرير دورة ${report.courseName}`}
            />
            <PrintButton targetId="course-report-content" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseReport;