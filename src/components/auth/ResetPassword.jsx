import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    token: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [searchParams] = useSearchParams();
  const { resetPassword, loading, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) {
      setFormData(prev => ({
        ...prev,
        email: emailFromUrl,
        token: tokenFromUrl || ''
      }));
      // Kullanıcı e-posta ile gelen kodu manuel olarak girecek
    } else {
      // If no email in URL, redirect to forgot password
      navigate('/forgot-password');
    }
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.token) {
      newErrors.token = 'Kod gereklidir';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Şifre gereklidir';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Şifre en az 6 karakter olmalıdır';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifre tekrarı gereklidir';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const resetData = {
      token: formData.token,
      email: formData.email,
      newPassword: formData.newPassword,
    };

    const result = await resetPassword(resetData);
    if (result.success) {
      alert(result.message);
      navigate('/login');
    }
  };

  if (!formData.email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-primary-dark">
              Geçersiz bağlantı
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.
            </p>
            <div className="mt-6">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-red hover:text-primary-red-700 transition-colors"
              >
                Yeni şifre sıfırlama isteği gönder
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-primary-dark">
            Yeni şifre oluşturun
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            E-posta: {formData.email}
          </p>
          <p className="mt-1 text-center text-xs text-gray-500">
            E-posta adresinize gönderilen kodu giriniz
          </p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-primary-dark">
                E-posta ile Gönderilen Kod
              </label>
              <input
                id="token"
                name="token"
                type="text"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-3 border ${
                  errors.token ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-primary-dark rounded-md focus:outline-none focus:ring-primary-red focus:border-primary-red text-sm`}
                placeholder="E-posta ile gönderilen kodu giriniz"
                value={formData.token}
                onChange={handleChange}
              />
              {errors.token && (
                <p className="mt-1 text-sm text-red-600">{errors.token}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-primary-dark">
                Yeni Şifre
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-3 border ${
                  errors.newPassword ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-primary-dark rounded-md focus:outline-none focus:ring-primary-red focus:border-primary-red text-sm`}
                placeholder="Yeni şifreniz"
                value={formData.newPassword}
                onChange={handleChange}
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-dark">
                Şifre Tekrarı
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-3 border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-primary-dark rounded-md focus:outline-none focus:ring-primary-red focus:border-primary-red text-sm`}
                placeholder="Şifrenizi tekrar giriniz"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-red hover:bg-primary-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Şifre sıfırlanıyor...' : 'Şifreyi Sıfırla'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-primary-red hover:text-primary-red-700 transition-colors"
            >
              Giriş sayfasına dön
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
