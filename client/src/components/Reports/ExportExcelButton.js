// ExportExcelButton.js
import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
const ExportExcelButton = ({ data, filename }) => { const handle = () => { const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Report'); const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }); saveAs(new Blob([buf]), `${filename}.xlsx`); }; return <button onClick={handle} className="bg-green-600 text-white px-3 py-1 rounded">Excel</button>; };
export default ExportExcelButton;