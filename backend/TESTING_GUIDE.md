# 🧪 Authentication Testing Guide

## Quick Test with Thunder Client / Postman

### 1️⃣ Register New User

**Request:**

```
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save these tokens for next requests!**

---

### 2️⃣ Login User

**Request:**

```
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response (200):** Same as register

---

### 3️⃣ Get User Profile (Protected)

**Request:**

```
GET http://localhost:8080/api/auth/profile
Authorization: Bearer <paste_accessToken_here>
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user",
    "created_at": "2026-04-14T15:48:26.145Z",
    "updated_at": "2026-04-14T15:48:26.145Z"
  }
}
```

---

### 4️⃣ Change Password (Protected)

**Request:**

```
POST http://localhost:8080/api/auth/change-password
Authorization: Bearer <paste_accessToken_here>
Content-Type: application/json

{
  "oldPassword": "password123",
  "newPassword": "newPassword456"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

---

### 5️⃣ Refresh Access Token

**Request:**

```
POST http://localhost:8080/api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "<paste_refreshToken_here>"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 6️⃣ Logout

**Request:**

```
POST http://localhost:8080/api/auth/logout
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {
    "instruction": "Delete tokens from client storage"
  }
}
```

---

## Error Testing

### Test: Register with invalid email

```json
{
  "email": "invalid",
  "password": "password123",
  "name": "Test"
}
```

✅ Should pass (email validation is loose - only checks format in DB)

### Test: Register with short password

```json
{
  "email": "test@example.com",
  "password": "123",
  "name": "Test User"
}
```

❌ Response: `"Password must be at least 6 characters"`

### Test: Register with duplicate email

First register with an email, then try again with the same email:

```json
{
  "email": "john@example.com",
  "password": "password123",
  "name": "Another John"
}
```

❌ Response: `"Email already registered"`

### Test: Login with wrong password

```json
{
  "email": "john@example.com",
  "password": "wrongPassword"
}
```

❌ Response: `"Invalid email or password"`

### Test: Access protected route without token

```
GET http://localhost:8080/api/auth/profile
(without Authorization header)
```

❌ Response (401): `"Access token required"`

### Test: Access protected route with invalid token

```
GET http://localhost:8080/api/auth/profile
Authorization: Bearer invalid_token_here
```

❌ Response (403): `"Invalid token"`

---

## JavaScript/Fetch Examples

### Register & Login with Token Storage

```javascript
// Register
const registerResponse = await fetch(
  "http://localhost:8080/api/auth/register",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "john@example.com",
      password: "password123",
      name: "John Doe",
    }),
  },
);

const { data } = await registerResponse.json();

// Store tokens
localStorage.setItem("accessToken", data.accessToken);
localStorage.setItem("refreshToken", data.refreshToken);
localStorage.setItem("user", JSON.stringify(data.user));

console.log("Registered user:", data.user);
```

### Get Profile with Auth

```javascript
const profileResponse = await fetch("http://localhost:8080/api/auth/profile", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  },
});

const { data: profile } = await profileResponse.json();
console.log("User profile:", profile);
```

### Refresh Token

```javascript
const refreshResponse = await fetch(
  "http://localhost:8080/api/auth/refresh-token",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refreshToken: localStorage.getItem("refreshToken"),
    }),
  },
);

const { data } = await refreshResponse.json();
localStorage.setItem("accessToken", data.accessToken);
console.log("Token refreshed!");
```

### Logout

```javascript
localStorage.removeItem("accessToken");
localStorage.removeItem("refreshToken");
localStorage.removeItem("user");
// Redirect to login page
window.location.href = "/login";
```

---

## 💡 Pro Tips

1. **Token Management**: Access tokens expire in 15 minutes. Implement auto-refresh logic in your frontend.

2. **Secure Storage**: In production, consider:
   - HttpOnly cookies for tokens (more secure than localStorage)
   - Secure flag for HTTPS only
   - SameSite attribute for CSRF protection

3. **Password Requirements**: Current minimum is 6 characters. For production, consider:
   - Minimum 8 characters
   - Uppercase + lowercase letters
   - Numbers and special characters
   - Check against common passwords

4. **Rate Limiting**: Already configured for general API routes. Consider adding specific auth route rate limiting.

5. **Email Verification**: Currently not implemented. Consider adding:
   - Email verification on registration
   - Forgot password flow
   - Email change verification

---

## 🐛 Troubleshooting

**Error: "Database connected successfully" not showing?**

- Check if PostgreSQL is running
- Verify DB credentials in `.env`
- Run: `npm run db:up` if using Docker

**Error: "Cannot find module"?**

- Run: `npm install`
- Check Node.js version: `node --version` (should be 16+)

**Tokens not working?**

- Ensure token format is: `Authorization: Bearer <token>`
- Check if token has expired (access token = 15 min)
- Regenerate with refresh token endpoint

---

Ready to test! 🚀
