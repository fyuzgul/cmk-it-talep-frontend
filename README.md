# IT Talep Sistemi Frontend

Bu proje, IT talep sistemi için React ve Tailwind CSS kullanılarak geliştirilmiş bir frontend uygulamasıdır.

## Özellikler

- **Kimlik Doğrulama**: Giriş, kayıt, şifre sıfırlama ve şifre yenileme
- **Modern UI**: Tailwind CSS ile responsive ve modern tasarım
- **Form Validasyonu**: Kapsamlı form doğrulama ve hata yönetimi
- **API Entegrasyonu**: Backend API ile entegrasyon
- **Güvenli Routing**: Korumalı rotalar ve otomatik yönlendirme

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

3. Tarayıcınızda `http://localhost:5173` adresini açın.

## API Endpoints

Uygulama aşağıdaki API endpoint'lerini kullanır:

- `POST /api/Auth/login` - Kullanıcı girişi
- `POST /api/Auth/register` - Kullanıcı kaydı
- `POST /api/Auth/forgot-password` - Şifre sıfırlama isteği
- `POST /api/Auth/reset-password` - Şifre sıfırlama

API base URL: `https://localhost:7097/api`

## Proje Yapısı

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── ForgotPassword.jsx
│   │   └── ResetPassword.jsx
│   ├── Dashboard.jsx
│   └── ProtectedRoute.jsx
├── contexts/
│   └── AuthContext.jsx
├── services/
│   └── api.js
├── App.jsx
└── main.jsx
```

## Kullanım

### Giriş Yapma
1. `/login` sayfasına gidin
2. E-posta ve şifrenizi girin
3. "Giriş Yap" butonuna tıklayın

### Kayıt Olma
1. `/register` sayfasına gidin
2. Gerekli bilgileri doldurun
3. "Kayıt Ol" butonuna tıklayın

### Şifre Sıfırlama
1. `/forgot-password` sayfasına gidin
2. E-posta adresinizi girin
3. E-posta kutunuzu kontrol edin
4. Gelen bağlantıya tıklayarak yeni şifre oluşturun

## Teknolojiler

- React 18
- React Router DOM
- Tailwind CSS
- Axios
- Vite

## Geliştirme

Projeyi geliştirmek için:

1. Yeni özellikler için branch oluşturun
2. Değişikliklerinizi commit edin
3. Pull request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.