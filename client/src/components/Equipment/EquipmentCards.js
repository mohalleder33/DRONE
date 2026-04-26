import React, { useState, useEffect } from 'react';
import * as equipmentService from '../../services/equipmentService';
import toast from 'react-hot-toast';
import { PencilIcon, TrashIcon, ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon, WrenchIcon, ShieldExclamationIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import DistributeEquipmentModal from './DistributeEquipmentModal';
import ReturnEquipmentModal from './ReturnEquipmentModal';
import WorkshopModal from './WorkshopModal';
import ReturnFromWorkshopModal from './ReturnFromWorkshopModal';
import RetireEquipmentModal from './RetireEquipmentModal';
import EditEquipmentModal from './EditEquipmentModal';
import BulkAddEquipmentModal from './BulkAddEquipmentModal';

const EquipmentCards = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await equipmentService.getGroupedEquipment();
      console.log('📦 البيانات من API:', data); // للتتبع
      if (Array.isArray(data)) {
        setGroups(data);
      } else {
        console.error('البيانات ليست مصفوفة:', data);
        setGroups([]);
      }
    } catch (error) {
      console.error('خطأ في جلب المعدات:', error);
      toast.error('فشل تحميل المعدات');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExpand = (key) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // استخدام _id بدلاً من id
  const handleAction = (item, type) => {
    if (!item || !item._id) {
      toast.error('بيانات المعدة غير مكتملة (لا يوجد _id)');
      console.error('Invalid item in handleAction:', item);
      return;
    }
    setSelectedEquipment({ id: item._id, name: item.name || 'معدة' });
    setModalType(type);
  };

  const handleEdit = (item) => {
    if (!item || !item._id) {
      toast.error('بيانات المعدة غير مكتملة للتعديل');
      return;
    }
    setSelectedEquipment({
      id: item._id,
      name: item.name,
      model: item.model,
      type: item.type,
      serialNumber: item.serialNumber || '',
      notes: item.notes || '',
    });
    setModalType('edit');
  };

  const handleDelete = async (id, name) => {
    if (!id) {
      toast.error('معرّف المعدة غير صالح');
      return;
    }
    if (window.confirm(`⚠️ هل أنت متأكد من حذف المعدة "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      try {
        await equipmentService.deleteEquipment(id);
        toast.success('تم حذف المعدة بنجاح');
        fetchData();
      } catch (error) {
        toast.error('فشل حذف المعدة');
      }
    }
  };

  const onSuccess = () => {
    setModalType(null);
    fetchData();
  };

  if (loading) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">جاري التحميل...</div>;
  if (!groups || groups.length === 0) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">لا توجد معدات. قم بإضافة معدات جديدة.</div>;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setShowBulkAddModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2">
          + إضافة متعددة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((groupItem) => {
          const key = `${groupItem.name}-${groupItem.model}`;
          const isExpanded = expandedGroups[key];
          return (
            <div key={key} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{groupItem.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">الموديل: {groupItem.model} | النوع: {groupItem.type}</p>
                  </div>
                  <button onClick={() => toggleExpand(key)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    {isExpanded ? <ChevronUpIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" /> : <ChevronDownIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
                  </button>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-800 dark:text-white">{groupItem.total}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">قطعة</span>
                </div>
              </div>

              {isExpanded && groupItem.items && (
                <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 grid grid-cols-3 gap-2 px-1">
                    <span>الرقم التسلسلي</span>
                    <span>الحالة</span>
                    <span className="text-center">الإجراءات</span>
                  </div>
                  {groupItem.items.map((item) => (
                    <div key={item._id || item.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 flex justify-between items-center">
                      <div className="flex-1">
                        <span className="text-sm font-mono text-gray-700 dark:text-gray-300">#{item.serialNumber || 'بدون رقم'}</span>
                      </div>
                      <div className="flex-1 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.status === 'جاهزة' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          item.status === 'موزعة' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          item.status === 'في الصيانة' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex-1 flex justify-center gap-1">
                        <button onClick={() => handleEdit(item)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400" title="تعديل">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(item._id, groupItem.name)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-red-600 dark:text-red-400" title="حذف">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                        {item.status === 'جاهزة' && (
                          <button onClick={() => handleAction(item, 'distribute')} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-green-600 dark:text-green-400" title="توزيع">
                            <ArrowRightOnRectangleIcon className="h-4 w-4" />
                          </button>
                        )}
                        {item.status === 'موزعة' && (
                          <button onClick={() => handleAction(item, 'return')} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400" title="إعادة">
                            <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                          </button>
                        )}
                        {item.status === 'جاهزة' && (
                          <button onClick={() => handleAction(item, 'workshop')} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-yellow-600 dark:text-yellow-400" title="إرسال للورشة">
                            <WrenchIcon className="h-4 w-4" />
                          </button>
                        )}
                        {item.status === 'في الصيانة' && (
                          <button onClick={() => handleAction(item, 'returnWorkshop')} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400" title="إعادة من الورشة">
                            <WrenchIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => handleAction(item, 'retire')} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="إخراج من الخدمة">
                          <ShieldExclamationIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* مودالات الإجراءات */}
      {modalType === 'distribute' && <DistributeEquipmentModal equipment={selectedEquipment} onClose={() => setModalType(null)} onSuccess={onSuccess} />}
      {modalType === 'return' && <ReturnEquipmentModal equipment={selectedEquipment} onClose={() => setModalType(null)} onSuccess={onSuccess} />}
      {modalType === 'workshop' && <WorkshopModal equipment={selectedEquipment} onClose={() => setModalType(null)} onSuccess={onSuccess} />}
      {modalType === 'returnWorkshop' && <ReturnFromWorkshopModal equipment={selectedEquipment} onClose={() => setModalType(null)} onSuccess={onSuccess} />}
      {modalType === 'retire' && <RetireEquipmentModal equipment={selectedEquipment} onClose={() => setModalType(null)} onSuccess={onSuccess} />}
      {modalType === 'edit' && <EditEquipmentModal equipment={selectedEquipment} onClose={() => setModalType(null)} onSuccess={onSuccess} />}
      {showBulkAddModal && <BulkAddEquipmentModal onClose={() => setShowBulkAddModal(false)} onSuccess={fetchData} />}
    </div>
  );
};

export default EquipmentCards;