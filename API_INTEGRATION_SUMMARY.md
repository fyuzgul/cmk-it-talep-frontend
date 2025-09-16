# CMK IT Request System - API Integration Summary

## Overview
This document provides a comprehensive overview of the API integration between the frontend React application and the CMK IT Request System backend API.

## API Base Configuration
- **Base URL**: `https://localhost:7097`
- **Proxy Configuration**: Vite development server proxies `/api` requests to the backend
- **Authentication**: Bearer token-based authentication with automatic token injection

## Implemented API Endpoints

### 1. Authentication (`/api/Auth`)
✅ **Implemented**
- `POST /api/Auth/login` - User login
- `POST /api/Auth/register` - User registration  
- `POST /api/Auth/forgot-password` - Password reset request
- `POST /api/Auth/reset-password` - Password reset confirmation

**Service**: `src/services/authService.js`
**Hook**: `src/hooks/useAuth.js`

### 2. Request Management (`/api/Request`)
✅ **Implemented**
- `GET /api/Request` - Get all requests with filtering
- `GET /api/Request/{id}` - Get request by ID
- `POST /api/Request` - Create new request
- `PUT /api/Request/{id}` - Update request
- `DELETE /api/Request/{id}` - Delete request
- `GET /api/Request/supportprovider/{id}` - Get requests by support provider
- `GET /api/Request/creator/{id}` - Get requests by creator
- `GET /api/Request/status/{id}` - Get requests by status
- `GET /api/Request/type/{id}` - Get requests by type
- `GET /api/Request/search/{description}` - Search requests

**Service**: `src/services/requestService.js`
**Hook**: `src/hooks/useRequests.js`

### 3. Request Types (`/api/RequestType`)
✅ **Implemented**
- `GET /api/RequestType` - Get all request types
- `POST /api/RequestType` - Create request type
- `PUT /api/RequestType/{id}` - Update request type
- `DELETE /api/RequestType/{id}` - Delete request type

**Service**: `src/services/requestService.js`

### 4. Request Status (`/api/RequestStatus`)
✅ **Implemented**
- `GET /api/RequestStatus` - Get all request statuses
- `POST /api/RequestStatus` - Create request status
- `PUT /api/RequestStatus/{id}` - Update request status
- `DELETE /api/RequestStatus/{id}` - Delete request status

**Service**: `src/services/requestService.js`

### 5. Request Responses (`/api/RequestResponse`)
✅ **Implemented**
- `GET /api/RequestResponse` - Get all request responses
- `GET /api/RequestResponse/{id}` - Get response by ID
- `GET /api/RequestResponse/request/{id}` - Get responses by request ID
- `POST /api/RequestResponse` - Create new response
- `PUT /api/RequestResponse/{id}` - Update response
- `DELETE /api/RequestResponse/{id}` - Delete response
- `POST /api/RequestResponse/mark-read/{id}` - Mark message as read
- `POST /api/RequestResponse/mark-conversation-read/{id}` - Mark conversation as read
- `GET /api/RequestResponse/unread` - Get unread messages
- `GET /api/RequestResponse/read-status/{id}` - Get read status for request

**Service**: `src/services/requestResponseService.js`
**Hook**: `src/hooks/useRequestResponses.js`

### 6. Online Status (`/api/OnlineStatus`)
✅ **Implemented**
- `GET /api/OnlineStatus/online-users` - Get all online users
- `GET /api/OnlineStatus/user/{id}/is-online` - Check if user is online
- `POST /api/OnlineStatus/update-last-seen` - Update last seen timestamp
- `POST /api/OnlineStatus/set-online/{id}` - Set user as online (testing)

**Service**: `src/services/onlineStatusService.js`
**Hook**: `src/hooks/useOnlineStatus.js`

### 7. User Management (`/api/User`)
✅ **Implemented**
- `GET /api/User` - Get all users
- `POST /api/User` - Create user
- `PUT /api/User/{id}` - Update user
- `DELETE /api/User/{id}` - Delete user
- `GET /api/UserType` - Get user types

**Service**: `src/services/userService.js`
**Hook**: `src/hooks/useUsers.js`

### 8. Department Management (`/api/Department`)
✅ **Implemented**
- `GET /api/Department` - Get all departments
- `POST /api/Department` - Create department
- `PUT /api/Department/{id}` - Update department
- `DELETE /api/Department/{id}` - Delete department

**Service**: `src/services/departmentService.js`
**Hook**: `src/hooks/useDepartments.js`

### 9. Support Types (`/api/SupportType`)
✅ **Implemented**
- `GET /api/SupportType` - Get all support types
- `POST /api/SupportType` - Create support type
- `PUT /api/SupportType/{id}` - Update support type
- `DELETE /api/SupportType/{id}` - Delete support type

**Service**: `src/services/supportService.js`
**Hook**: `src/hooks/useSupport.js`

## Key Features Implemented

### 1. Authentication Flow
- Automatic token injection in API requests
- Token expiration handling with automatic logout
- Protected routes with authentication checks

### 2. Request Management
- Complete CRUD operations for requests
- Advanced filtering and search capabilities
- Request status tracking and updates
- File upload support for screenshots

### 3. Real-time Messaging
- Chat-like interface for request conversations
- Read/unread message tracking
- Message status indicators
- Automatic conversation marking as read

### 4. Online Status Tracking
- User presence detection
- Last seen timestamp updates
- Online user list display
- Automatic status updates every 30 seconds

### 5. Admin Management
- User management with role-based access
- Department management
- Request type and status management
- Support type management

## API Test Panel

A comprehensive test panel has been created (`src/components/APITestPanel.jsx`) that allows testing of all API endpoints:

### Test Features
- Individual endpoint testing
- Batch testing of all endpoints
- Real-time result display
- Error handling and reporting
- Online user status monitoring

### Available Tests
1. Request Types retrieval
2. Request creation and management
3. Message sending and receiving
4. Read status tracking
5. Online status management
6. User presence detection

## File Structure

```
src/
├── services/
│   ├── api.js                    # Base API configuration
│   ├── authService.js            # Authentication endpoints
│   ├── requestService.js         # Request management
│   ├── requestResponseService.js # Message handling
│   ├── onlineStatusService.js    # Online status tracking
│   ├── userService.js            # User management
│   ├── departmentService.js      # Department management
│   └── supportService.js         # Support type management
├── hooks/
│   ├── useAuth.js               # Authentication hook
│   ├── useRequests.js           # Request management hook
│   ├── useRequestResponses.js   # Message handling hook
│   ├── useOnlineStatus.js       # Online status hook
│   ├── useUsers.js              # User management hook
│   ├── useDepartments.js        # Department management hook
│   └── useSupport.js            # Support management hook
└── components/
    ├── APITestPanel.jsx         # API testing interface
    ├── user/                    # User-facing components
    ├── admin/                   # Admin management components
    └── support/                 # Support team components
```

## Usage Examples

### Basic Request Creation
```javascript
import { useRequests } from '../hooks/useRequests';

const { createRequest } = useRequests();

const newRequest = await createRequest({
  requestCreatorId: user.id,
  description: "Computer performance issue",
  screenshotFilePath: "/uploads/screenshot.png",
  requestTypeId: 1
});
```

### Message Handling
```javascript
import { useRequestResponses } from '../hooks/useRequestResponses';

const { createRequestResponse, markAsRead } = useRequestResponses();

// Send message
await createRequestResponse({
  message: "Thank you for your help!",
  requestId: 1
});

// Mark as read
await markAsRead(messageId);
```

### Online Status Management
```javascript
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const { fetchOnlineUsers, updateLastSeen } = useOnlineStatus();

// Get online users
const onlineUsers = await fetchOnlineUsers();

// Update last seen
await updateLastSeen();
```

## Error Handling

All services include comprehensive error handling:
- Network error detection
- API error message extraction
- User-friendly error messages
- Automatic retry mechanisms where appropriate

## Security Features

- Bearer token authentication
- Automatic token refresh
- Secure API communication over HTTPS
- Input validation and sanitization
- CORS handling

## Performance Optimizations

- Request caching where appropriate
- Debounced API calls
- Lazy loading of components
- Efficient state management
- Optimistic UI updates

## Conclusion

The frontend application now provides complete integration with all CMK IT Request System API endpoints. The implementation includes:

- ✅ All 21 API endpoints from your test collection
- ✅ Comprehensive error handling
- ✅ Real-time features (online status, messaging)
- ✅ Admin management capabilities
- ✅ User-friendly interfaces
- ✅ Testing and debugging tools

The system is ready for production use and can handle the complete workflow from user registration to request resolution with full message tracking and online presence features.
