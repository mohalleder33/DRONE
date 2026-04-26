import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/roleUtils';
import PersonnelTabs from '../components/Personnel/PersonnelTabs';
import OfficersList from '../components/Personnel/OfficersList';
import NCOList from '../components/Personnel/NCOList';
import RecruitsList from '../components/Personnel/RecruitsList';

const PersonnelPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('officers');
  const [refreshKey, setRefreshKey] = useState(0);
  
  const canEdit = can(user, 'update');

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">إدارة الكوادر</h1>
      </div>

      <PersonnelTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div>
        {activeTab === 'officers' && (
          <OfficersList 
            key={`officers-${refreshKey}`} 
            user={user} 
            onRefresh={handleRefresh}
            canEdit={canEdit}
          />
        )}
        {activeTab === 'ncos' && (
          <NCOList 
            key={`ncos-${refreshKey}`} 
            user={user} 
            onRefresh={handleRefresh}
            canEdit={canEdit}
          />
        )}
        {activeTab === 'recruits' && (
          <RecruitsList 
            key={`recruits-${refreshKey}`} 
            user={user} 
            onRefresh={handleRefresh}
            canEdit={canEdit}
          />
        )}
      </div>
    </div>
  );
};

export default PersonnelPage;