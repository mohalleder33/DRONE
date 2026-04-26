import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HeadquartersPage from './pages/HeadquartersPage';
import PlatformsPage from './pages/PlatformsPage';
import PlatformDetailPage from './pages/PlatformDetailPage';
import PersonnelPage from './pages/PersonnelPage';
import EquipmentPage from './pages/EquipmentPage';
import AmmunitionPage from './pages/AmmunitionPage';
import TrainingCoursesPage from './pages/TrainingCoursesPage';
import WorkshopPage from './pages/WorkshopPage';
import ReportsPage from './pages/ReportsPage';
import LogsPage from './pages/LogsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './middleware/ProtectedRoute';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">جاري تحميل التطبيق...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-left" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="headquarters" element={
            <ProtectedRoute requiredPage="/headquarters">
              <HeadquartersPage />
            </ProtectedRoute>
          } />
          <Route path="platforms" element={
            <ProtectedRoute requiredPage="/platforms">
              <PlatformsPage />
            </ProtectedRoute>
          } />
          <Route path="platforms/:id" element={
            <ProtectedRoute requiredPage="/platforms">
              <PlatformDetailPage />
            </ProtectedRoute>
          } />
          <Route path="personnel" element={
            <ProtectedRoute requiredPage="/personnel">
              <PersonnelPage />
            </ProtectedRoute>
          } />
          <Route path="equipment" element={
            <ProtectedRoute requiredPage="/equipment">
              <EquipmentPage />
            </ProtectedRoute>
          } />
          <Route path="ammunition" element={
            <ProtectedRoute requiredPage="/ammunition">
              <AmmunitionPage />
            </ProtectedRoute>
          } />
          <Route path="courses" element={
            <ProtectedRoute requiredPage="/courses">
              <TrainingCoursesPage />
            </ProtectedRoute>
          } />
          <Route path="workshop" element={
            <ProtectedRoute requiredPage="/workshop">
              <WorkshopPage />
            </ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute requiredPage="/reports">
              <ReportsPage />
            </ProtectedRoute>
          } />
          <Route path="logs" element={
            <ProtectedRoute requiredPage="/logs">
              <LogsPage />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute requiredPage="/settings">
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute requiredPage="/profile">
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute requiredPage="/users">
              <UsersPage />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;