import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      toast.success('تم تسجيل الدخول بنجاح');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل تسجيل الدخول');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('تم تسجيل الخروج');
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      toast.success('تم تغيير كلمة المرور');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل تغيير كلمة المرور');
      return false;
    }
  };

  const updateProfile = async (data) => {
    try {
      const res = await api.put('/users/profile', data);
      const updatedUser = res.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success('تم تحديث الملف الشخصي');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل التحديث');
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};     