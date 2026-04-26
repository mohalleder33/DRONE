import React from 'react';

const PersonnelTabs = ({ activeTab, setActiveTab }) => (
  <div className="border-b border-gray-200 dark:border-gray-700">
    <nav className="flex gap-6">
      {['officers', 'ncos', 'recruits'].map(tab => (
        <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 px-1 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
          {tab === 'officers' ? 'الضباط' : tab === 'ncos' ? 'ضباط الصف' : 'المستنفرين'}
        </button>
      ))}
    </nav>
  </div>
);
export default PersonnelTabs;