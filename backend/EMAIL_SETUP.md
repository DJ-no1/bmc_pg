# Email Verification & Booking Emails Setup Guide

## Overview

This guide explains the email verification implementation for auth and booking confirmation/cancellation emails using Resend.

## Environment Variables Required

Add these to your `.env` file:

```env
# Resend API Configuration
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@bookmyticket.com
FRONTEND_URL=http://localhost:5173

# Keep these optional (no longer needed with Resend)
# SMTP_HOST=smtp.resend.com
# SMTP_PORT=465
# SMTP_USER=resend
# SMTP_PASS=...
```

Get your Resend API key from [https://resend.com](https://resend.com)

## Database Migration

Run the migration to add email verification fields:

```sql
-- Via psql or your database client
psql -U your_user -d bookmyticket < src/common/migration/02_add_email_verification.sql
```

Or run the SQL manually in your database:

```sql
ALTER TABLE users
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_token VARCHAR(255),
ADD COLUMN verification_expires_at TIMESTAMP;

UPDATE users SET is_verified = TRUE WHERE is_verified IS NULL;

CREATE INDEX idx_users_verification_token ON users(verification_token);
```

## Installation

```bash
npm install resend
```

## API Endpoints

### Register (with email verification)

```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

# Response
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Verify Email

```bash
GET /auth/verify-email/:token
```

The user clicks the link in their email, which calls this endpoint.

### Login (requires verified email)

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# If email not verified, a new verification email is sent
# Response error: "Email not verified. Verification email has been sent to your inbox."
```

## Email Functions

### 1. Verification Email (Auth)

Automatically sent on registration. 24-hour expiry.

**File**: `src/common/config/email.js`

```javascript
import { sendVerificationEmail } from "../common/config/email.js";

// Send verification email
await sendVerificationEmail(email, token, userName);
```

### 2. Booking Confirmation Email

Use after successful booking:

```javascript
import { sendBookingConfirmation } from "../common/config/email.js";

await sendBookingConfirmation({
  to: user.email,
  userName: user.name,
  movieTitle: "The Dark Knight",
  showTime: "2024-04-20T19:00:00Z",
  seats: "A1, A2",
  totalPrice: 960.0,
  bookingId: 12345,
});
```

### 3. Cancellation Email

Use after booking cancellation:

```javascript
import { sendCancellationEmail } from "../common/config/email.js";

await sendCancellationEmail({
  to: user.email,
  userName: user.name,
  movieTitle: "The Dark Knight",
  showTime: "2024-04-20T19:00:00Z",
  seats: "A1, A2",
  refundAmount: 960.0,
  bookingId: 12345,
});
```

## Flow Diagram

### Registration Flow

```
User Register
    ↓
Hash Password
    ↓
Create User (is_verified = FALSE)
    ↓
Generate Verification Token
    ↓
Send Verification Email ← Email with 24-hour link
    ↓
Return Access + Refresh Token
```

### Login Flow

```
User Login
    ↓
Find User
    ↓
Validate Password
    ↓
Check is_verified?
    ├─ YES → Return tokens + Login successful
    └─ NO → Generate new verification token
          → Resend verification email
          → Return error: "Email not verified"
```

### Email Verification Flow

```
User clicks link in email
    ↓
GET /auth/verify-email/:token
    ↓
Find token + check expiry
    ↓
Update is_verified = TRUE
    ↓
Return success message
    ↓
User can now login
```

## Testing

### 1. Test Registration & Verification

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Get token from email (check Resend dashboard for test)
# Verify email
curl http://localhost:3000/auth/verify-email/<token_from_email>

# Login (should now work)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Test Booking Emails

In your booking service:

```javascript
import { sendBookingConfirmation } from "../common/config/email.js";

// After successful booking
await sendBookingConfirmation({
  to: user.email,
  userName: user.name,
  movieTitle: movie.title,
  showTime: show.show_time,
  seats: bookedSeats.join(", "),
  totalPrice: totalAmount,
  bookingId: booking.id,
});
```

## Email Templates

All email templates are styled with:

- Gradient headers
- Responsive design
- Indian locale date formatting (en-IN)
- Professional HTML structure

Customize templates in:

- `src/common/config/email.js` → `sendVerificationEmail()`
- `src/common/config/email.js` → `sendBookingConfirmation()`
- `src/common/config/email.js` → `sendCancellationEmail()`

## Troubleshooting

### "Invalid or expired verification token"

- Token expired (24-hour limit)
- User or token doesn't exist
  → User must register again to get a new token

### "Invalid RESEND_API_KEY"

- Check `.env` file for correct key
- Verify key is active on Resend dashboard
- Ensure no extra spaces or quotes

### Emails not sending

- Check Resend dashboard for API key
- Verify `FROM_EMAIL` domain is authorized in Resend
- Check server logs for error details
- Ensure `.env` variables are loaded

### Database migration failed

- Make sure you're using a fresh database schema
- Run `02_add_email_verification.sql` migration
- Check PostgreSQL user permissions

## Next Steps

1. ✅ Install Resend package: `npm install resend`
2. ✅ Add `.env` variables (RESEND_API_KEY, FROM_EMAIL, FRONTEND_URL)
3. ✅ Run database migration: `02_add_email_verification.sql`
4. ✅ Test registration & email verification flow
5. Add booking confirmation emails to booking service
6. Add cancellation emails to booking cancellation logic
