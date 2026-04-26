import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService';
import { getPlatforms } from '../services/platformsService';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getRoleLabel, ROLES } from '../utils/roleUtils';
import toast from 'react-hot-toast';

const UsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: ROLES.VIEWER,
    assignedPlatformId: '',
    rank: '',
    militaryId: ''
  });

  // التحقق من صلاحية المسؤول
  if (user?.role !== ROLES.ADMIN) {
    return (
      <div className="p-8 text-center text-red-600">
        غير مصرح لك بالوصول إلى هذه الصفحة
      </div>
    );
  }

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const res = await getPlatforms(1, 100);
      setPlatforms(res.data.data || []);
    } catch (error) {
      console.error('Error fetching platforms:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPlatforms();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.email) {
      toast.error('الاسم واسم المستخدم والبريد الإلكتروني مطلوبة');
      return;
    }
    if (!editingUser && !formData.password) {
      toast.error('كلمة المرور مطلوبة للمستخدم الجديد');
      return;
    }
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await updateUser(editingUser._id, updateData);
        toast.success('تم تحديث المستخدم');
      } else {
        await createUser(formData);
        toast.success('تم إضافة المستخدم');
      }
      fetchUsers();
      setShowModal(false);
      setEditingUser(null);
      resetForm();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.message || 'فشل حفظ المستخدم');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        await deleteUser(id);
        toast.success('تم حذف المستخدم');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('فشل الحذف');
      }
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      assignedPlatformId: user.assignedPlatformId || '',
      rank: user.rank || '',
      militaryId: user.militaryId || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      role: ROLES.VIEWER,
      assignedPlatformId: '',
      rank: '',
      militaryId: ''
    });
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      [ROLES.ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      [ROLES.COMMANDER]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      [ROLES.PLATFORM_COMMANDER]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      [ROLES.WORKSHOP]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      [ROLES.TRAINING_SUPERVISOR]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      [ROLES.VIEWER]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return colors[role] || colors[ROLES.VIEWER];
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          إدارة المستخدمين
        </h1>
        <button
          onClick={() => {
            setEditingUser(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition"
        >
          <PlusIcon className="h-5 w-5" /> مستخدم جديد
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">لا يوجد مستخدمين</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold">الاسم</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">اسم المستخدم</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">البريد الإلكتروني</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">الرتبة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">الصلاحية</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">المنصة المخصصة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3">{u.username}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.rank || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${getRoleBadgeColor(u.role)}`}>
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.assignedPlatformId || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="تعديل"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        {u._id !== user?._id && (
                          <button
                            onClick={() => handleDelete(u._id)}
                            className="text-red-600 hover:text-red-800 transition"
                            title="حذف"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* مودال إضافة/تعديل مستخدم */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
            </h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="الاسم *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700"
                required
              />
              <input
                type="text"
                placeholder="اسم المستخدم *"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700"
                required
              />
              <input
                type="email"
                placeholder="البريد الإلكتروني *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700"
                required
              />
              <input
                type="password"
                placeholder={editingUser ? "كلمة المرور (اتركها فارغة لتعديل)" : "كلمة المرور *"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700"
                required={!editingUser}
              />
              <input
                type="text"
                placeholder="الرتبة"
                value={formData.rank}
                onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700"
              />
              <input
                type="text"
                placeholder="الرقم العسكري"
                value={formData.militaryId}
                onChange={(e) => setFormData({ ...formData, militaryId: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700"
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700"
              >
                <option value={ROLES.VIEWER}>مشاهد (Viewer)</option>
                <option value={ROLES.COMMANDER}>قائد الرئاسة (Commander)</option>
                <option value={ROLES.PLATFORM_COMMANDER}>قائد منصة (Platform Commander)</option>
                <option value={ROLES.WORKSHOP}>مسؤول الورشة (Workshop)</option>
                <option value={ROLES.TRAINING_SUPERVISOR}>مشرف التدريب (Training Supervisor)</option>
                <option value={ROLES.ADMIN}>مدير النظام (Admin)</option>
              </select>
              
              {formData.role === ROLES.PLATFORM_COMMANDER && (
                <select
                  value={formData.assignedPlatformId}
                  onChange={(e) => setFormData({ ...formData, assignedPlatformId: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 dark:bg-gray-700"
                >
                  <option value="">اختر المنصة المخصصة</option>
                  {platforms.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
              
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-md hover:bg-gray-400 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;