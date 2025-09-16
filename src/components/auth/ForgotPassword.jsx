import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const { forgotPassword, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
    // Clear error when user starts typing
    if (errors.email) {
      setErrors({});
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'E-posta adresi gereklidir';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await forgotPassword(email);
    if (result.success) {
      // E-posta gönderildikten sonra reset password sayfasına yönlendir
      // Kullanıcı e-posta ile gelen kodu manuel olarak girecek
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-primary-dark">
            Şifrenizi mi unuttunuz?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
          </p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary-dark">
              E-posta adresi
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`mt-1 appearance-none relative block w-full px-3 py-3 border ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              } placeholder-gray-500 text-primary-dark rounded-md focus:outline-none focus:ring-primary-red focus:border-primary-red text-sm`}
              placeholder="E-posta adresiniz"
              value={email}
              onChange={handleChange}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
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
              {loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Bağlantısı Gönder'}
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

export default ForgotPassword;
