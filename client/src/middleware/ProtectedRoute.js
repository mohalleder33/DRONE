import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessPage } from '../utils/roleUtils';

const ProtectedRoute = ({ children, requiredPage }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-600 dark:text-gray-400">جاري تحميل الجلسة...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // التحقق من صلاحية الوصول إلى الصفحة
  if (requiredPage && !canAccessPage(user, requiredPage)) {
    // إذا كان المستخدم مسجلاً ولكن ليس لديه صلاحية الصفحة
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-red-600 text-xl mb-4">⛔ غير مصرح</div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          ليس لديك صلاحية للوصول إلى هذه الصفحة
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          العودة
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;