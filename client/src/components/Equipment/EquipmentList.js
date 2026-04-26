import React, { useState, useEffect } from 'react';
import * as equipmentService from '../../services/equipmentService';
import toast from 'react-hot-toast';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const EquipmentList = () => {
  const [equipment, setEquipment] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const res = await equipmentService.getEquipment(page, pagination.limit, { search, status: statusFilter });
      
      // ✅ التحقق الآمن من البيانات
      const dataArray = res?.data || [];
      const paginationData = res?.pagination || { page: 1, pages: 1, total: 0, limit: 10 };
      
      setEquipment(dataArray);
      setPagination(paginationData);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast.error('فشل تحميل المعدات');
      setEquipment([]);
      setPagination({ page: 1, pages: 1, total: 0, limit: 10 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [search, statusFilter]);

  const handleDelete = async (id, name) => {
    if (!id) {
      toast.error('معرّف المعدة غير صالح');
      return;
    }
    if (window.confirm(`⚠️ هل أنت متأكد من حذف المعدة "${name}"؟`)) {
      try {
        await equipmentService.deleteEquipment(id);
        toast.success('تم الحذف');
        fetchData(pagination.page);
      } catch (error) {
        toast.error('فشل الحذف');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'جاهزة': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'موزعة': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'في الصيانة': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">جاري التحميل...</div>;
  }

  // ✅ التحقق من أن equipment مصفوفة قبل محاولة استخدام .map
  if (!Array.isArray(equipment) || equipment.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">لا توجد معدات</div>;
  }

  return (
    <div>
      {/* شريط البحث والفلاتر */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="بحث بالاسم أو الرقم التسلسلي"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">كل الحالات</option>
          <option value="جاهزة">جاهزة</option>
          <option value="موزعة">موزعة</option>
          <option value="في الصيانة">في الصيانة</option>
          <option value="خارج الخدمة">خارج الخدمة</option>
        </select>
      </div>

      {/* جدول المعدات */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="p-3 text-right">الاسم</th>
              <th className="p-3 text-right">الموديل</th>
              <th className="p-3 text-right">النوع</th>
              <th className="p-3 text-right">الرقم التسلسلي</th>
              <th className="p-3 text-right">الحالة</th>
              <th className="p-3 text-right">الموقع</th>
              <th className="p-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((eq) => (
              <tr key={eq._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-3">{eq.name || '-'}</td>
                <td className="p-3">{eq.model || '-'}</td>
                <td className="p-3">{eq.type || '-'}</td>
                <td className="p-3">{eq.serialNumber || '-'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(eq.status)}`}>
                    {eq.status || '-'}
                  </span>
                </td>
                <td className="p-3">{eq.currentLocation || '-'}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => {/* TODO: فتح مودال تعديل */}}
                      className="p-1 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="تعديل"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(eq._id, eq.name)}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="حذف"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={pagination.page === 1}
          onClick={() => fetchData(pagination.page - 1)}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50"
        >
          السابق
        </button>
        <span className="text-gray-600 dark:text-gray-400">
          صفحة {pagination.page} من {pagination.pages}
        </span>
        <button
          disabled={pagination.page === pagination.pages}
          onClick={() => fetchData(pagination.page + 1)}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50"
        >
          التالي
        </button>
      </div>
    </div>
  );
};

export default EquipmentList;