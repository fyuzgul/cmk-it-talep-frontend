import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // You might want to validate the token with the backend
      setUser({ token });
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authAPI.login(credentials);
      
      // Backend'den token gelmiyor, sadece kullanıcı bilgileri geliyor
      if (response && response.id) {
        // Token olmadığı için basit bir session ID oluşturuyoruz
        const sessionToken = `session_${Date.now()}_${response.id}`;
        localStorage.setItem('token', sessionToken);
        setUser({ 
          token: sessionToken, 
          id: response.id,
          firstName: response.firstName,
          lastName: response.lastName,
          email: response.email,
          departmentId: response.departmentId,
          typeId: response.typeId,
          department: response.department,
          userType: response.userType
        });
        return { success: true };
      } else {
        throw new Error('Login failed - invalid response format');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Giriş yapılırken bir hata oluştu';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authAPI.register(userData);
      return { success: true, message: 'Kayıt başarılı' };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Kayıt olurken bir hata oluştu';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authAPI.forgotPassword(email);
      return { success: true, message: 'Şifre sıfırlama kodu e-posta adresinize gönderildi' };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Şifre sıfırlama isteği gönderilirken bir hata oluştu';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (resetData) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authAPI.resetPassword(resetData);
      return { success: true, message: 'Şifreniz başarıyla sıfırlandı' };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Şifre sıfırlanırken bir hata oluştu';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
