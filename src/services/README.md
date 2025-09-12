# Services ve Hooks Yapısı

Bu klasör, API servislerini ve custom hook'ları organize eder.

## Klasör Yapısı

```
src/
├── services/
│   ├── api.js                 # Ana API konfigürasyonu ve interceptor'lar
│   ├── authService.js         # Kimlik doğrulama servisleri
│   ├── departmentService.js   # Departman yönetimi servisleri
│   ├── userService.js         # Kullanıcı yönetimi servisleri
│   ├── requestService.js      # Talep yönetimi servisleri
│   ├── supportService.js      # Destek türü servisleri
│   └── index.js              # Tüm servisleri export eder
└── hooks/
    ├── useAuth.js            # Kimlik doğrulama hook'u
    ├── useDepartments.js     # Departman yönetimi hook'u
    ├── useUsers.js           # Kullanıcı yönetimi hook'u
    ├── useRequests.js        # Talep yönetimi hook'u
    ├── useSupport.js         # Destek türü hook'u
    └── index.js              # Tüm hook'ları export eder
```

## Servisler

### AuthService
- `login(credentials)` - Kullanıcı girişi
- `register(userData)` - Kullanıcı kaydı
- `forgotPassword(email)` - Şifre sıfırlama isteği
- `resetPassword(resetData)` - Şifre sıfırlama

### DepartmentService
- `getDepartments()` - Tüm departmanları getir
- `createDepartment(departmentData)` - Yeni departman oluştur
- `updateDepartment(id, departmentData)` - Departman güncelle
- `deleteDepartment(id)` - Departman sil

### UserService
- `getUsers()` - Tüm kullanıcıları getir
- `createUser(userData)` - Yeni kullanıcı oluştur
- `updateUser(id, userData)` - Kullanıcı güncelle
- `deleteUser(id)` - Kullanıcı sil
- `getUserTypes()` - Kullanıcı türlerini getir

### RequestService
- **Request Types:**
  - `getRequestTypes()` - Talep türlerini getir
  - `createRequestType(typeData)` - Yeni talep türü oluştur
  - `updateRequestType(id, typeData)` - Talep türü güncelle
  - `deleteRequestType(id)` - Talep türü sil

- **Request Statuses:**
  - `getRequestStatuses()` - Talep durumlarını getir
  - `createRequestStatus(statusData)` - Yeni talep durumu oluştur
  - `updateRequestStatus(id, statusData)` - Talep durumu güncelle
  - `deleteRequestStatus(id)` - Talep durumu sil

- **Request Response Types:**
  - `getRequestResponseTypes()` - Talep/İstek türlerini getir
  - `createRequestResponseType(typeData)` - Yeni talep/istek türü oluştur
  - `updateRequestResponseType(id, typeData)` - Talep/istek türü güncelle
  - `deleteRequestResponseType(id)` - Talep/istek türü sil

### SupportService
- `getSupportTypes()` - Destek türlerini getir
- `createSupportType(typeData)` - Yeni destek türü oluştur
- `updateSupportType(id, typeData)` - Destek türü güncelle
- `deleteSupportType(id)` - Destek türü sil

## Custom Hooks

### useAuth
```javascript
const { login, register, forgotPassword, resetPassword, loading, error } = useAuth();
```

### useDepartments
```javascript
const { 
  departments, 
  loading, 
  error, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment 
} = useDepartments();
```

### useUsers
```javascript
const { 
  users, 
  userTypes, 
  loading, 
  error, 
  createUser, 
  updateUser, 
  deleteUser 
} = useUsers();
```

### useRequests
```javascript
const { 
  requestTypes,
  requestStatuses,
  requestResponseTypes,
  loading,
  error,
  // Request Types
  createRequestType,
  updateRequestType,
  deleteRequestType,
  // Request Statuses
  createRequestStatus,
  updateRequestStatus,
  deleteRequestStatus,
  // Request Response Types
  createRequestResponseType,
  updateRequestResponseType,
  deleteRequestResponseType
} = useRequests();
```

### useSupport
```javascript
const { 
  supportTypes, 
  loading, 
  error, 
  createSupportType, 
  updateSupportType, 
  deleteSupportType 
} = useSupport();
```

## Kullanım Örneği

```javascript
import { useDepartments } from '../hooks/useDepartments';

const DepartmentComponent = () => {
  const {
    departments,
    loading,
    error,
    createDepartment,
    updateDepartment,
    deleteDepartment
  } = useDepartments();

  const handleCreate = async (data) => {
    try {
      await createDepartment(data);
      // Başarılı işlem
    } catch (error) {
      // Hata yönetimi
    }
  };

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error}</div>;

  return (
    <div>
      {departments.map(dept => (
        <div key={dept.id}>{dept.name}</div>
      ))}
    </div>
  );
};
```

## Avantajlar

1. **Organizasyon**: Her servis kendi dosyasında, ilgili API'ler gruplandırılmış
2. **Yeniden Kullanılabilirlik**: Custom hook'lar sayesinde aynı mantık farklı componentlerde kullanılabilir
3. **Hata Yönetimi**: Her hook kendi loading ve error state'lerini yönetir
4. **Otomatik Yenileme**: CRUD işlemlerinden sonra veriler otomatik olarak yenilenir
5. **Type Safety**: Her servis ve hook kendi tipini tanımlar
6. **Bakım Kolaylığı**: Değişiklikler tek yerden yapılabilir
