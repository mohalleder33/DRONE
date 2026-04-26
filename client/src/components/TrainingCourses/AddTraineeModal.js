import React, { useState, useEffect } from 'react';
import { addTraineeFromDatabase, addManualTrainee, getAvailablePersonnel } from '../../services/trainingCourseService';
import toast from 'react-hot-toast';
import { RANKS } from '../../constants/personnelConstants';

const AddTraineeModal = ({ courseId, onClose, onSuccess }) => {
  const [mode, setMode] = useState('database'); // 'database' or 'manual'
  const [available, setAvailable] = useState({ officers: [], ncos: [], recruits: [] });
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('');
  const [selectedType, setSelectedType] = useState('officers');
  const [manualData, setManualData] = useState({
    name: '',
    rank: '',
    militaryId: '',
    specialization: '',
    unit: '',
    type: 'officers' // يمكن اختيار النوع
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setFetching(true);
      try {
        const res = await getAvailablePersonnel();
        const all = res.data;
        setAvailable({
          officers: all.filter(p => p.type === 'officers'),
          ncos: all.filter(p => p.type === 'ncos'),
          recruits: all.filter(p => p.type === 'recruits')
        });
      } catch (error) {
        console.error('Error fetching available personnel:', error);
        toast.error('فشل تحميل الكوادر المتاحة');
      } finally {
        setFetching(false);
      }
    };
    fetch();
  }, []);

  const handleManualTypeChange = (e) => {
    const newType = e.target.value;
    setManualData({ ...manualData, type: newType });
    // تعيين رتبة افتراضية بناءً على النوع
    if (newType === 'recruits') setManualData(prev => ({ ...prev, rank: 'مستنفر' }));
    else if (newType === 'officers') setManualData(prev => ({ ...prev, rank: RANKS.officers[0] }));
    else if (newType === 'ncos') setManualData(prev => ({ ...prev, rank: RANKS.ncos[0] }));
  };

  const handleManualChange = (e) => {
    setManualData({ ...manualData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === 'database') {
        if (!selectedPersonnelId || !selectedType) throw new Error('اختر كادراً');
        await addTraineeFromDatabase(courseId, selectedPersonnelId, selectedType);
      } else {
        if (!manualData.name || !manualData.rank) throw new Error('الاسم والرتبة مطلوبة');
        await addManualTrainee(courseId, manualData);
      }
      toast.success('تمت الإضافة');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || 'فشل الإضافة');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableByType = () => {
    if (selectedType === 'officers') return available.officers;
    if (selectedType === 'ncos') return available.ncos;
    return available.recruits;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">إضافة دارس جديد</h3>
        <div className="flex gap-2 mb-4">
          <button type="button" onClick={() => setMode('database')} className={`px-3 py-1 rounded ${mode === 'database' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>من قاعدة البيانات</button>
          <button type="button" onClick={() => setMode('manual')} className={`px-3 py-1 rounded ${mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>إضافة يدوياً</button>
        </div>

        {mode === 'database' && (
          <>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full border p-2 mb-2 rounded">
              <option value="officers">ضباط</option>
              <option value="ncos">ضباط صف</option>
              <option value="recruits">مستنفرين</option>
            </select>
            {fetching ? (
              <div className="text-center py-2">جاري التحميل...</div>
            ) : (
              <select value={selectedPersonnelId} onChange={(e) => setSelectedPersonnelId(e.target.value)} className="w-full border p-2 mb-4 rounded">
                <option value="">اختر كادراً</option>
                {getAvailableByType().map(p => (
                  <option key={p._id || p.id} value={p._id || p.id}>{p.name} - {p.rank} ({p.militaryId || 'بدون رقم'})</option>
                ))}
              </select>
            )}
          </>
        )}

        {mode === 'manual' && (
          <>
            <select name="type" value={manualData.type} onChange={handleManualTypeChange} className="w-full border p-2 mb-2 rounded" required>
              <option value="officers">ضابط</option>
              <option value="ncos">ضابط صف</option>
              <option value="recruits">مستنفر</option>
            </select>
            <input name="name" placeholder="الاسم الكامل *" onChange={handleManualChange} className="w-full border p-2 mb-2 rounded" required />
            <input name="rank" placeholder="الرتبة *" value={manualData.rank} onChange={handleManualChange} className="w-full border p-2 mb-2 rounded" required />
            <input name="militaryId" placeholder="الرقم العسكري (اختياري)" onChange={handleManualChange} className="w-full border p-2 mb-2 rounded" />
            <input name="specialization" placeholder="التخصص (اختياري)" onChange={handleManualChange} className="w-full border p-2 mb-2 rounded" />
            <input name="unit" placeholder="الوحدة (اختياري)" onChange={handleManualChange} className="w-full border p-2 mb-2 rounded" />
          </>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">إلغاء</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">إضافة</button>
        </div>
      </div>
    </div>
  );
};

export default AddTraineeModal;