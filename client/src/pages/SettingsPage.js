import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AccordionSection from '../components/Common/AccordionSection';
import ToggleSwitch from '../components/Common/ToggleSwitch';
import { getNotificationPreferences, updateNotificationPreferences } from '../services/userPreferenceService';
import { getAllSettings, updateSetting, resetAllSettings, applyCriticalThresholdToAll } from '../services/settingService';
import { getAlertSettings, updateAlertSetting } from '../services/alertService';
import { ROLES } from '../utils/roleUtils';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { user, changePassword } = useAuth();
  const [openSections, setOpenSections] = useState({ password: true, notifications: false, system: false, alerts: false });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notificationPrefs, setNotificationPrefs] = useState({ sound: true, assignment: true, return: true, rotationAlert: true, courseEnrollment: true, attendanceChange: true, platformAlert: true, lowStock: true, workshop: true });
  const [settings, setSettings] = useState({});
  const [alertSettings, setAlertSettings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const isAdmin = user?.role === ROLES.ADMIN;

  useEffect(() => {
    if (user) {
      getNotificationPreferences().then(res => setNotificationPrefs(res.data)).catch(() => {});
      if (isAdmin) {
        getAllSettings().then(res => setSettings(res.data)).catch(() => {});
        getAlertSettings().then(res => setAlertSettings(res.data)).catch(() => {});
      }
    }
  }, [user, isAdmin]);

  const handlePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور غير متطابقة');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('كلمة المرور قصيرة (6 أحرف على الأقل)');
      return;
    }
    setPasswordLoading(true);
    const ok = await changePassword(oldPassword, newPassword);
    if (ok) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setPasswordLoading(false);
  };

  const toggleSection = (s) => setOpenSections(prev => ({ ...prev, [s]: !prev[s] }));

  const updateNotif = async (key, val) => {
    const newPrefs = { ...notificationPrefs, [key]: val };
    setNotificationPrefs(newPrefs);
    await updateNotificationPreferences(newPrefs).catch(() => toast.error('فشل حفظ الإعدادات'));
  };

  const updateSettingField = async (key, value) => {
    try {
      await updateSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('تم التحديث');
    } catch (error) {
      toast.error('فشل التحديث');
    }
  };

  const resetSettings = async () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات؟')) {
      await resetAllSettings();
      toast.success('تمت الإعادة');
      window.location.reload();
    }
  };

  const applyCritical = async () => {
    if (window.confirm('تطبيق الحد الحرج على جميع الذخائر؟')) {
      await applyCriticalThresholdToAll();
      toast.success('تم التطبيق');
    }
  };

  const updateAlert = async (type, data) => {
    try {
      await updateAlertSetting(type, data);
      const res = await getAlertSettings();
      setAlertSettings(res.data);
      toast.success('تم التحديث');
    } catch (error) {
      toast.error('فشل التحديث');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الإعدادات</h1>

      {/* 🔐 تغيير كلمة المرور - للجميع */}
      <AccordionSection title="🔐 تغيير كلمة المرور" section="password" isOpen={openSections.password} onToggle={toggleSection}>
        <form onSubmit={handlePassword} className="space-y-3">
          <input type="password" placeholder="كلمة المرور الحالية" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700" required />
          <input type="password" placeholder="كلمة المرور الجديدة" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700" required />
          <input type="password" placeholder="تأكيد كلمة المرور الجديدة" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700" required />
          <button type="submit" disabled={passwordLoading} className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition">تغيير كلمة المرور</button>
        </form>
      </AccordionSection>

      {/* 🔔 إعدادات الإشعارات - للجميع */}
      <AccordionSection title="🔔 إعدادات الإشعارات" section="notifications" isOpen={openSections.notifications} onToggle={toggleSection}>
        <div className="space-y-2">
          <ToggleSwitch enabled={notificationPrefs.sound} onChange={(v) => updateNotif('sound', v)} label="تشغيل صوت الإشعارات" />
          <ToggleSwitch enabled={notificationPrefs.assignment} onChange={(v) => updateNotif('assignment', v)} label="تعيين على منصة" />
          <ToggleSwitch enabled={notificationPrefs.return} onChange={(v) => updateNotif('return', v)} label="إعادة من منصة" />
          <ToggleSwitch enabled={notificationPrefs.rotationAlert} onChange={(v) => updateNotif('rotationAlert', v)} label="اقتراب انتهاء المأمورية" />
          <ToggleSwitch enabled={notificationPrefs.courseEnrollment} onChange={(v) => updateNotif('courseEnrollment', v)} label="التسجيل في دورة" />
          <ToggleSwitch enabled={notificationPrefs.attendanceChange} onChange={(v) => updateNotif('attendanceChange', v)} label="تغيير حالة الحضور" />
          <ToggleSwitch enabled={notificationPrefs.platformAlert} onChange={(v) => updateNotif('platformAlert', v)} label="تنبيهات المنصة" />
          <ToggleSwitch enabled={notificationPrefs.lowStock} onChange={(v) => updateNotif('lowStock', v)} label="مخزون منخفض" />
          <ToggleSwitch enabled={notificationPrefs.workshop} onChange={(v) => updateNotif('workshop', v)} label="الورشة والصيانة" />
        </div>
      </AccordionSection>

      {/* ⚙️ إعدادات النظام - فقط للمسؤول */}
      {isAdmin && (
        <AccordionSection title="⚙️ إعدادات النظام" section="system" isOpen={openSections.system} onToggle={toggleSection}>
          <div className="space-y-3">
            <label className="block">أيام الخدمة المستهدفة</label>
            <input type="number" value={settings.defaultTargetServiceDays || 30} onChange={(e) => updateSettingField('defaultTargetServiceDays', parseInt(e.target.value))} className="w-full border p-2 rounded dark:bg-gray-700" />
            
            <label className="block">عتبة الغيارات القريبة (أيام)</label>
            <input type="number" value={settings.alertThreshold || 7} onChange={(e) => updateSettingField('alertThreshold', parseInt(e.target.value))} className="w-full border p-2 rounded dark:bg-gray-700" />
            
            <label className="block">الحد الأدنى للمخزون الحرج للذخائر</label>
            <input type="number" value={settings.criticalStockThreshold || 50} onChange={(e) => updateSettingField('criticalStockThreshold', parseInt(e.target.value))} className="w-full border p-2 rounded dark:bg-gray-700" />
            
            <label className="block">الحد الأدنى للمعدات الحرجة</label>
            <input type="number" value={settings.criticalEquipmentThreshold || 5} onChange={(e) => updateSettingField('criticalEquipmentThreshold', parseInt(e.target.value))} className="w-full border p-2 rounded dark:bg-gray-700" />
            
            <label className="block">اسم النظام</label>
            <input value={settings.systemName || 'وحدة الطيران المسير'} onChange={(e) => updateSettingField('systemName', e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700" />
            
            <div className="flex gap-2">
              <button onClick={applyCritical} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">تطبيق الحد الحرج على جميع الذخائر</button>
              <button onClick={resetSettings} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">إعادة تعيين الإعدادات</button>
            </div>
          </div>
        </AccordionSection>
      )}

      {/* ⚠️ إعدادات التنبيهات - فقط للمسؤول */}
      {isAdmin && (
        <AccordionSection title="⚠️ إعدادات التنبيهات" section="alerts" isOpen={openSections.alerts} onToggle={toggleSection}>
          {Array.isArray(alertSettings) && alertSettings.map(alert => (
            <div key={alert.type} className="border-b py-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold">{alert.name}</span>
                  <p className="text-sm text-gray-500">{alert.description}</p>
                </div>
                <ToggleSwitch enabled={alert.enabled} onChange={(v) => updateAlert(alert.type, { enabled: v })} label="" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span>العتبة: {alert.threshold}</span>
                <button onClick={() => {
                  const newVal = prompt('أدخل العتبة الجديدة', alert.threshold);
                  if (newVal && !isNaN(parseInt(newVal))) {
                    updateAlert(alert.type, { threshold: parseInt(newVal) });
                  }
                }} className="text-blue-600 text-sm hover:underline">تعديل</button>
              </div>
            </div>
          ))}
        </AccordionSection>
      )}
    </div>
  );
};

export default SettingsPage;