import React from 'react';
import { exportCourseReport } from '../../services/trainingCourseService';
import toast from 'react-hot-toast';

const ExportReportButton = ({ courseId, format }) => {
  const handle = async () => { try { const res = await exportCourseReport(courseId, format); const blob = new Blob([res.data], { type: format==='excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `report_${courseId}.${format==='excel'?'xlsx':'pdf'}`; a.click(); URL.revokeObjectURL(url); toast.success('تم التصدير'); } catch(e){ toast.error('فشل التصدير'); } };
  return (<button onClick={handle} className="text-sm bg-gray-200 px-2 py-1 rounded">{format==='excel'?'📊 Excel':'📄 PDF'}</button>);
};
export default ExportReportButton;