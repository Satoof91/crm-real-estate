# Real Estate CRM - API Documentation

## Table of Contents
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Pagination](#pagination)
- [File Upload](#file-upload)
- [API Endpoints](#api-endpoints)

---

## Authentication

The API uses session-based authentication with Passport.js and bcrypt for password hashing.

### Setup

1. Set the `SESSION_SECRET` environment variable in your `.env` file
2. Sessions last 7 days by default
3. Cookies are HTTP-only and secure in production

### User Roles

- `admin`: Full access to all resources
- `manager`: Can create, update, and delete most resources
- `user`: Read-only access, can update payments

---

## Authorization

Routes are protected with middleware:

- `isAuthenticated`: Requires user to be logged in
- `isManagerOrAdmin`: Requires manager or admin role
- `isAdmin`: Requires admin role

---

## Pagination

List endpoints support pagination via query parameters:

```
GET /api/contacts?page=1&limit=50
GET /api/contracts?page=2&limit=25
GET /api/payments?page=1&limit=100
```

**Parameters:**
- `page` (default: 1): Page number
- `limit` (default: 50): Items per page

**Response format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

---

## File Upload

Contract documents can be uploaded via the file upload endpoint.

**Endpoint:** `POST /api/upload/contract`

**Authorization:** Manager or Admin only

**Supported formats:** PDF, JPG, JPEG, PNG

**Max file size:** 10MB

**Request:**
```
Content-Type: multipart/form-data

document: [file]
```

**Response:**
```json
{
  "filename": "1234567890-contract.pdf",
  "originalName": "contract.pdf",
  "url": "/uploads/contracts/1234567890-contract.pdf",
  "size": 102400,
  "mimetype": "application/pdf"
}
```

Use the returned `url` when creating/updating contracts.

---

## API Endpoints

### Authentication

#### Register
```
POST /api/auth/register
```

**Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "role": "user"
}
```

**Response:** User object (without password)

---

#### Login
```
POST /api/auth/login
```

**Body:**
```json
{
  "username": "johndoe",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "user",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

#### Logout
```
POST /api/auth/logout
```

**Auth:** Required

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

#### Get Current User
```
GET /api/auth/me
```

**Auth:** Required

**Response:** User object (without password)

---

### Contacts

#### List Contacts (with pagination)
```
GET /api/contacts?page=1&limit=50
```

**Auth:** Required

**Response:** Paginated contacts list

---

#### Get Contact
```
GET /api/contacts/:id
```

**Auth:** Required

---

#### Create Contact
```
POST /api/contacts
```

**Auth:** Required

**Body:**
```json
{
  "fullName": "Jane Smith",
  "phone": "+1234567890",
  "email": "jane@example.com",
  "nationalId": "123456789",
  "language": "en",
  "status": "prospect",
  "isWhatsAppEnabled": true
}
```

---

#### Update Contact
```
PATCH /api/contacts/:id
```

**Auth:** Required

**Body:** Partial contact object (any fields)

**Validation:** All fields validated on server

---

#### Delete Contact
```
DELETE /api/contacts/:id
```

**Auth:** Manager or Admin

---

### Buildings

#### List Buildings
```
GET /api/buildings
```

**Auth:** Required

---

#### Get Building
```
GET /api/buildings/:id
```

**Auth:** Required

---

#### Create Building
```
POST /api/buildings
```

**Auth:** Manager or Admin

**Body:**
```json
{
  "name": "Building A",
  "address": "123 Main St",
  "totalUnits": 10
}
```

---

#### Update Building
```
PATCH /api/buildings/:id
```

**Auth:** Manager or Admin

**Body:** Partial building object

**Validation:** Server-side validation applied

---

#### Delete Building
```
DELETE /api/buildings/:id
```

**Auth:** Manager or Admin

---

### Units

#### List Units
```
GET /api/units?buildingId=uuid
```

**Auth:** Required

**Query params:**
- `buildingId` (optional): Filter by building

---

#### Get Unit
```
GET /api/units/:id
```

**Auth:** Required

---

#### Create Unit
```
POST /api/units
```

**Auth:** Manager or Admin

**Body:**
```json
{
  "buildingId": "uuid",
  "unitNumber": "101",
  "type": "apartment",
  "size": 850,
  "status": "vacant"
}
```

---

#### Update Unit
```
PATCH /api/units/:id
```

**Auth:** Manager or Admin

**Body:** Partial unit object

**Validation:** Server-side validation applied

---

#### Delete Unit
```
DELETE /api/units/:id
```

**Auth:** Manager or Admin

---

### Contracts

#### List Contracts (with pagination)
```
GET /api/contracts?page=1&limit=50
```

**Auth:** Required

**Response:** Paginated contracts list

---

#### Get Contract
```
GET /api/contracts/:id
```

**Auth:** Required

---

#### Create Contract
```
POST /api/contracts
```

**Auth:** Manager or Admin

**Body:**
```json
{
  "unitId": "uuid",
  "contactId": "uuid",
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2026-01-01T00:00:00Z",
  "rentAmount": "1500.00",
  "paymentFrequency": "monthly",
  "securityDeposit": "1500.00",
  "documentUrl": "/uploads/contracts/1234567890-contract.pdf"
}
```

**Note:** This automatically:
- Updates unit status to "occupied"
- Generates payment schedule based on frequency

---

#### Update Contract
```
PATCH /api/contracts/:id
```

**Auth:** Manager or Admin

**Body:** Partial contract object

**Validation:** Server-side validation applied

---

#### Delete Contract
```
DELETE /api/contracts/:id
```

**Auth:** Manager or Admin

**Note:** Automatically reverts unit status to "vacant"

---

### Payments

#### List Payments (with pagination)
```
GET /api/payments?page=1&limit=50&contractId=uuid
```

**Auth:** Required

**Query params:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `contractId` (optional): Filter by contract

**Response:** Paginated payments list

---

#### Get Payment
```
GET /api/payments/:id
```

**Auth:** Required

---

#### Create Payment
```
POST /api/payments
```

**Auth:** Manager or Admin

**Body:**
```json
{
  "contractId": "uuid",
  "dueDate": "2025-02-01T00:00:00Z",
  "amount": "1500.00",
  "status": "pending"
}
```

---

#### Update Payment
```
PATCH /api/payments/:id
```

**Auth:** Required (all authenticated users)

**Body:** Partial payment object (commonly used to mark as paid)

```json
{
  "status": "paid",
  "paidDate": "2025-02-01T00:00:00Z"
}
```

**Validation:** Server-side validation applied

---

#### Delete Payment
```
DELETE /api/payments/:id
```

**Auth:** Manager or Admin

---

### Dashboard

#### Get Metrics
```
GET /api/dashboard/metrics
```

**Auth:** Required

**Response:**
```json
{
  "totalUnits": 100,
  "occupancyRate": 85,
  "pendingPayments": 15,
  "expiringContracts": 3
}
```

---

#### Get Notifications
```
GET /api/notifications
```

**Auth:** Required

**Response:**
```json
[
  {
    "id": "payment-reminder-uuid",
    "type": "payment",
    "message": "Payment reminder for Unit 101 (John Doe) is due in 5 days",
    "time": "upcoming",
    "data": {
      "paymentId": "uuid",
      "unitNumber": "101",
      "tenantName": "John Doe"
    }
  },
  {
    "id": "contract-expiry-uuid",
    "type": "contract",
    "message": "Contract for Unit 201 (Jane Smith) expires in 25 days",
    "time": "upcoming",
    "data": {
      "contractId": "uuid",
      "unitNumber": "201",
      "tenantName": "Jane Smith"
    }
  }
]
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message here"
}
```

**Common status codes:**
- `400`: Bad Request (validation error)
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

Currently not implemented. Consider adding rate limiting middleware for production.

---

## CORS

CORS is not configured. Configure based on your frontend deployment needs.

---

## Security Notes

1. **SESSION_SECRET**: Must be set to a strong random value in production
2. **HTTPS**: Ensure secure cookies work correctly by enabling HTTPS in production
3. **File Upload**: Files are validated for type and size. Consider adding virus scanning in production
4. **Password Policy**: Implement password strength requirements on the frontend and backend
5. **Rate Limiting**: Add rate limiting to prevent brute force attacks
6. **Input Sanitization**: All inputs are validated with Zod schemas

---

## Database Migrations

After pulling the latest code, run:

```bash
npm run db:push
```

This will:
1. Create the `users` table
2. Add any new schema changes to your database

---

## First User Setup

After deploying, create your first admin user:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "your-secure-password",
    "fullName": "Admin User",
    "role": "admin"
  }'
```

Then login with those credentials.
