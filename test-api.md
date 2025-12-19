# Testing the Real Estate CRM API

The server is running at: **http://localhost:5000**

## 1. Create Admin User

```powershell
curl -X POST http://localhost:5000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"admin\",\"email\":\"admin@example.com\",\"password\":\"Admin123!\",\"fullName\":\"Admin User\",\"role\":\"admin\"}'
```

Or use this simpler version:
```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/auth/register -Method POST -ContentType "application/json" -Body '{"username":"admin","email":"admin@example.com","password":"Admin123!","fullName":"Admin User","role":"admin"}'
```

## 2. Login

```powershell
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -Uri http://localhost:5000/api/auth/login -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"Admin123!"}' -WebSession $session
```

## 3. Get Current User

```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/auth/me -WebSession $session
```

## 4. Get Contacts (with pagination)

```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/contacts?page=1&limit=10" -WebSession $session
```

## 5. Create a Contact

```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/contacts -Method POST -ContentType "application/json" -Body '{"fullName":"John Doe","phone":"+1234567890","email":"john@example.com","language":"en","status":"prospect"}' -WebSession $session
```

---

## Using Browser/Postman

### 1. Register Admin
- **URL:** `POST http://localhost:5000/api/auth/register`
- **Body:**
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "Admin123!",
  "fullName": "Admin User",
  "role": "admin"
}
```

### 2. Login
- **URL:** `POST http://localhost:5000/api/auth/login`
- **Body:**
```json
{
  "username": "admin",
  "password": "Admin123!"
}
```

### 3. Test Pagination
- **URL:** `GET http://localhost:5000/api/contacts?page=1&limit=10`
- Session cookie will be sent automatically

### 4. Upload File
- **URL:** `POST http://localhost:5000/api/upload/contract`
- **Content-Type:** `multipart/form-data`
- **Field name:** `document`
- **File:** Select a PDF or image

---

## Frontend Access

Navigate to: **http://localhost:5000**

The React frontend should load (note: it won't work fully without auth integration).

---

## Database

Your SQLite database is stored at: `local.db`

You can inspect it using:
```powershell
sqlite3 local.db
.tables
SELECT * FROM users;
.exit
```

Or use a GUI tool like:
- DB Browser for SQLite
- DBeaver
- DataGrip

---

## Quick Test Checklist

- [ ] Server is running on port 5000
- [ ] Can register admin user
- [ ] Can login
- [ ] Can access protected endpoint
- [ ] Pagination works
- [ ] Can create resources (contacts, buildings, etc.)
- [ ] Can upload files
- [ ] Validation works (try invalid data)
- [ ] Authorization works (try with regular user)

---

## Stop Server

Press `Ctrl+C` in the terminal to stop the development server.
