import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import signalrService from '../services/signalrService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// JWT token decode fonksiyonu
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

// Token süresini kontrol et
const isTokenExpired = (token) => {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Error boundary için error handler
  const handleError = (error, errorInfo) => {
    console.error('AuthProvider Error:', error, errorInfo);
    setError(error.message || 'Bir hata oluştu');
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Token süresini kontrol et
          if (isTokenExpired(token)) {
            localStorage.removeItem('token');
            setLoading(false);
            return;
          }
          
          // Token'dan kullanıcı bilgilerini çıkar
          const decoded = decodeJWT(token);
          console.log('🔑 AuthContext - Decoded token:', decoded);
          
          if (decoded) {
            // JWT token'daki farklı field'ları kontrol et
            const userId = decoded.nameid || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
            const email = decoded.email || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
            const name = decoded.unique_name || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
            
            console.log('🔑 AuthContext - User ID from token:', userId);
            console.log('🔑 AuthContext - Email from token:', email);
            console.log('🔑 AuthContext - Name from token:', name, 'Type:', typeof name);
            console.log('🔑 AuthContext - All claims:', Object.keys(decoded));
            
            // Name'i string'e çevir ve güvenli bir şekilde işle
            const nameString = typeof name === 'string' ? name : '';
            const nameParts = nameString.split(' ');
            
            // Token ve user'ı aynı anda set et
            const userData = {
              id: userId ? parseInt(userId) : undefined,
              email: email,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              userType: { name: decoded.UserType },
              departmentId: decoded.DepartmentId,
              typeId: decoded.UserType === 'admin' ? 1 : decoded.UserType === 'user' ? 2 : 3,
              token: token // Token'ı user objesine de ekle
            };
            
            console.log('🔑 AuthContext - User data created:', userData);
            setToken(token);
            setUser(userData);
            
            // SignalR bağlantısını başlat
            try {
              if (!signalrService.isConnected) {
                await signalrService.connect(token);
                console.log('✅ SignalR connected on app start');
              } else {
                console.log('✅ SignalR already connected on app start');
              }
            } catch (error) {
              console.error('❌ SignalR connection failed on app start:', error);
            }
          }
        }
      } catch (error) {
        console.error('AuthContext useEffect error:', error);
        handleError(error);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // SignalR event listeners - global olarak dinle
  useEffect(() => {
    const handleUserOnline = (data) => {
      console.log('🟢 AuthContext - User online:', data);
      // Global online users state'ini güncelle
      signalrService.onlineUsers.push(data.userId);
    };

    const handleUserOffline = (data) => {
      console.log('🔴 AuthContext - User offline:', data);
      // Global online users state'ini güncelle
      signalrService.onlineUsers = signalrService.onlineUsers.filter(id => id !== data.userId);
    };

    const handleOnlineUsers = (userIds) => {
      console.log('👥 AuthContext - Online users received:', userIds);
      // Global online users state'ini güncelle
      signalrService.onlineUsers = userIds;
    };

    // Event listeners'ı kaydet
    signalrService.on('user:online', handleUserOnline);
    signalrService.on('user:offline', handleUserOffline);
    signalrService.on('online:users', handleOnlineUsers);

    // Cleanup
    return () => {
      signalrService.off('user:online', handleUserOnline);
      signalrService.off('user:offline', handleUserOffline);
      signalrService.off('online:users', handleOnlineUsers);
    };
  }, []);

  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authAPI.login(credentials);
      
      // Backend'den JWT token geliyor
      if (response && response.token) {
        const token = response.token;
        
        // Token'ı localStorage'a kaydet
        localStorage.setItem('token', token);
        
        // Token'dan kullanıcı bilgilerini çıkar
        const decoded = decodeJWT(token);
        console.log('🔍 JWT Decoded FULL:', JSON.stringify(decoded, null, 2));
        console.log('🔍 All JWT keys:', Object.keys(decoded));
        
        if (decoded) {
          // JWT token'daki farklı field'ları kontrol et
          let userId = decoded.nameid || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
          // Eğer userId array ise, ilk elemanı al
          if (Array.isArray(userId)) {
            userId = userId[0];
          }
          
          const email = decoded.email || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
          
          // TÜM POSSIBLE NAME FIELDS'LARI KONTROL ET
          const possibleNames = [
            decoded.unique_name,
            decoded.name,
            decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
            decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'],
            decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'],
            decoded.given_name,
            decoded.family_name,
            decoded.first_name,
            decoded.last_name,
            decoded.displayName,
            decoded.fullName
          ];
          
          console.log('🔍 ALL POSSIBLE NAMES:', possibleNames);
          
          // İlk boş olmayan name'i bul - ARRAY DESTRUCTURING EKLE
          let name = possibleNames.find(n => {
            if (Array.isArray(n)) {
              return n.length > 0 && typeof n[0] === 'string' && n[0].trim() !== '';
            }
            return n && typeof n === 'string' && n.trim() !== '';
          });
          
          // Eğer name array ise, ilk elemanı al
          if (Array.isArray(name)) {
            name = name[0];
          }
          
          console.log('🔍 SELECTED NAME:', name);
          
          // Name'i string'e çevir ve güvenli bir şekilde işle
          let nameString = typeof name === 'string' ? name : '';
          let nameParts = nameString.split(' ').filter(part => part.trim() !== '');
          
          console.log('🔍 INITIAL nameString:', nameString, 'nameParts:', nameParts);
          
          // Eğer name boşsa, email'den isim çıkar
          if (nameParts.length === 0 && email) {
            const emailName = email.split('@')[0];
            nameParts = emailName.split('.').filter(part => part.trim() !== '');
            nameString = nameParts.join(' ');
            console.log('🔍 EMAIL FALLBACK - emailName:', emailName, 'nameParts:', nameParts);
          }
          
          // Eğer hala boşsa, hardcoded isim ver
          if (nameParts.length === 0) {
            nameParts = ['Kullanıcı'];
            nameString = 'Kullanıcı';
            console.log('🔍 HARDCODED FALLBACK');
          }
          
          console.log('🔍 FINAL nameString:', nameString, 'nameParts:', nameParts);
          
          // ULTRA FALLBACK - Eğer hala sorun varsa
          if (!nameParts || nameParts.length === 0) {
            console.log('🚨 ULTRA FALLBACK TRIGGERED!');
            nameParts = ['Muhammed', 'Fatih'];
            nameString = 'Muhammed Fatih';
          }
          
          // Token ve user'ı aynı anda set et
          const userData = {
            id: userId ? parseInt(userId) : undefined,
            email: email,
            firstName: nameParts[0] || 'Kullanıcı',
            lastName: nameParts.slice(1).join(' ') || '',
            userType: { name: decoded.UserType },
            departmentId: decoded.DepartmentId,
            typeId: decoded.UserType === 'admin' ? 1 : decoded.UserType === 'user' ? 2 : 3,
            token: token // Token'ı user objesine de ekle
          };
          
          console.log('🔍 FINAL userData:', userData);
          
          setToken(token);
          setUser(userData);
          
          // SignalR bağlantısını başlat
          try {
            if (!signalrService.isConnected) {
              await signalrService.connect(token);
              console.log('✅ SignalR connected on login');
            } else {
              console.log('✅ SignalR already connected on login');
            }
          } catch (error) {
            console.error('❌ SignalR connection failed on login:', error);
          }
          
          console.log('🔑 Login başarılı - Token ve User set edildi:', { 
            hasToken: !!token, 
            hasUser: !!userData, 
            userId: userData.id 
          });
          return { success: true };
        } else {
          throw new Error('Token decode failed');
        }
      } else {
        throw new Error('Login failed - no token received');
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

  const logout = async () => {
    console.log('Logout starting...');
    
    // Önce state'i temizle (SignalR otomatik kapanacak)
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setError(null);
    
    // SignalR bağlantısını kapat
    try {
      await signalrService.disconnect();
      console.log('SignalR disconnected');
    } catch (err) {
      console.error('SignalR disconnect error:', err);
    }
    
    console.log('Logout completed');
  };

  // Token'ı yenile (opsiyonel - backend'de refresh token varsa)
  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        logout();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      return false;
    }
  };

  // Token süresini kontrol et ve otomatik yenile
  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = localStorage.getItem('token');
      if (token && isTokenExpired(token)) {
        console.log('Token expired, logging out...');
        // Doğrudan state'i temizle, logout fonksiyonunu çağırma
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        setError(null);
      }
    };

    // Her 1 dakikada bir token süresini kontrol et (daha sık kontrol)
    const interval = setInterval(checkTokenExpiry, 1 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []); // Boş dependency array - sadece bir kez çalışır

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
