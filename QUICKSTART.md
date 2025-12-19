# Quick Start Guide

Get your Real Estate CRM up and running in 5 minutes.

---

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (can use Neon, Supabase, or local)
- Git (optional)

---

## Step 1: Install Dependencies

```bash
npm install
```

---

## Step 2: Configure Environment

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=generate-a-random-secret-here
PORT=5000
NODE_ENV=development
```

**Generate a secure session secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 3: Update Database Schema

```bash
npm run db:push
```

This creates the necessary tables including the new `users` table.

---

## Step 4: Start the Development Server

```bash
npm run dev
```

Server will start at: `http://localhost:5000`

---

## Step 5: Create Your First Admin User

### Option A: Using cURL

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "YourSecurePassword123!",
    "fullName": "System Administrator",
    "role": "admin"
  }'
```

### Option B: Using Postman/Insomnia

**Endpoint:** `POST http://localhost:5000/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "YourSecurePassword123!",
  "fullName": "System Administrator",
  "role": "admin"
}
```

---

## Step 6: Login

### Using cURL

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "YourSecurePassword123!"
  }' \
  -c cookies.txt
```

Save the session cookie for authenticated requests.

### Using Postman/Insomnia

**Endpoint:** `POST http://localhost:5000/api/auth/login`

**Body:**
```json
{
  "username": "admin",
  "password": "YourSecurePassword123!"
}
```

The session cookie will be automatically saved by your API client.

---

## Step 7: Test an Authenticated Endpoint

### Using cURL

```bash
curl http://localhost:5000/api/contacts?page=1&limit=10 \
  -b cookies.txt
```

### Using Postman/Insomnia

**Endpoint:** `GET http://localhost:5000/api/contacts?page=1&limit=10`

The session cookie will be automatically sent.

---

## Common Commands

### Development
```bash
npm run dev          # Start dev server with hot reload
npm run check        # Type check TypeScript
npm run build        # Build for production
npm run start        # Start production server
```

### Database
```bash
npm run db:push      # Push schema changes to database
```

---

## Testing File Upload

### 1. Create a test PDF or image

### 2. Upload via cURL

```bash
curl -X POST http://localhost:5000/api/upload/contract \
  -b cookies.txt \
  -F "document=@/path/to/your/file.pdf"
```

### 3. Response

```json
{
  "filename": "1736668800000-file.pdf",
  "originalName": "file.pdf",
  "url": "/uploads/contracts/1736668800000-file.pdf",
  "size": 102400,
  "mimetype": "application/pdf"
}
```

### 4. Access uploaded file

Navigate to: `http://localhost:5000/uploads/contracts/1736668800000-file.pdf`

---

## Creating Additional Users

### Manager User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "manager",
    "email": "manager@example.com",
    "password": "ManagerPassword123!",
    "fullName": "Property Manager",
    "role": "manager"
  }'
```

### Regular User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user",
    "email": "user@example.com",
    "password": "UserPassword123!",
    "fullName": "Regular User",
    "role": "user"
  }'
```

---

## User Roles & Permissions

| Action | Admin | Manager | User |
|--------|-------|---------|------|
| View all resources | ✅ | ✅ | ✅ |
| Create contacts | ✅ | ✅ | ✅ |
| Update contacts | ✅ | ✅ | ✅ |
| Delete contacts | ✅ | ✅ | ❌ |
| Create buildings | ✅ | ✅ | ❌ |
| Create units | ✅ | ✅ | ❌ |
| Create contracts | ✅ | ✅ | ❌ |
| Update payments | ✅ | ✅ | ✅ |
| Delete resources | ✅ | ✅ | ❌ |
| Upload files | ✅ | ✅ | ❌ |

---

## API Endpoints Quick Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Resources (all support pagination)
- `GET /api/contacts?page=1&limit=50`
- `GET /api/contracts?page=1&limit=50`
- `GET /api/payments?page=1&limit=50&contractId=uuid`
- `GET /api/buildings`
- `GET /api/units?buildingId=uuid`

### File Upload
- `POST /api/upload/contract` - Upload contract document

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/notifications` - Get notifications

---

## Pagination

All list endpoints return:

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

**Query parameters:**
- `page` (default: 1)
- `limit` (default: 50)

---

## Troubleshooting

### "DATABASE_URL not set"
- Ensure `.env` file exists
- Check `DATABASE_URL` is set correctly
- Verify database is accessible

### "Unauthorized" errors
- Make sure you're logged in
- Check session cookie is being sent
- Try logging in again

### "Forbidden" errors
- Your user role doesn't have permission
- Use an admin/manager account for this operation

### File upload fails
- Check file size (max 10MB)
- Check file type (PDF, JPG, JPEG, PNG only)
- Ensure you're logged in as manager/admin

### TypeScript errors
```bash
npm run check
```

### Port already in use
```bash
# Change PORT in .env file
PORT=3000
```

---

## Next Steps

1. ✅ System is running
2. ✅ Admin user created
3. 📱 **Update frontend for authentication**
4. 📱 **Update frontend for pagination**
5. 📱 **Add file upload UI**
6. 🔒 **Review security checklist before production**

---

## Documentation

- **API Reference:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Implementation Details:** [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Update Notes:** [UPDATES.md](./UPDATES.md)

---

## Support

**Check logs:**
```bash
npm run dev
# Look for errors in console
```

**Verify TypeScript:**
```bash
npm run check
```

**Database connection:**
```bash
# Test DATABASE_URL in .env
```

---

**Ready to Go!** 🚀

Your Real Estate CRM is now:
- ✅ Secured with authentication
- ✅ Protected with role-based access
- ✅ Optimized with pagination
- ✅ Validated on the server
- ✅ Equipped with file uploads

Happy coding!
