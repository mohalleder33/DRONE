import React from 'react';

const ToggleSwitch = ({ enabled, onChange, label }) => {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={enabled} onChange={(e) => onChange(e.target.checked)} />
        <div className={`block w-10 h-6 rounded-full transition ${enabled ? 'bg-blue-600' : 'bg-gray-400 dark:bg-gray-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${enabled ? 'transform translate-x-4' : ''}`}></div>
      </div>
    </label>
  );
};

export default ToggleSwitch;