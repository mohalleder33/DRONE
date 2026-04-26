// PrintButton.js
import React from 'react';
const PrintButton = () => { const handle = () => { const content = document.getElementById('report-content'); const win = window.open('', '_blank'); win.document.write(`<html><head><title>تقرير</title><style>body{font-family:Tajawal;direction:rtl;padding:20px}</style></head><body>${content.innerHTML}</body></html>`); win.document.close(); win.print(); }; return <button onClick={handle} className="bg-gray-600 text-white px-3 py-1 rounded">طباعة</button>; };
export default PrintButton;