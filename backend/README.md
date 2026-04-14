# 🎬 Book My Show - Complete Ticket Booking System

A full-featured Express.js and PostgreSQL backend for a movie ticket booking application with JWT authentication, transaction-based seat locking, and comprehensive security features.

## Features

✅ **User Authentication**

- Registration with email validation
- JWT-based login/logout
- Token refresh mechanism
- Password management (change password, secure hashing with bcryptjs)
- Protected user profiles

✅ **Movie Management**

- Browse all available movies
- Get movie details (genre, rating, duration)
- Mocked data for easy testing

✅ **Show Management**

- View all shows across movies
- Real-time seat availability
- Dynamic pricing per show

✅ **Booking System**

- Atomic transactions with ACID guarantees
- PostgreSQL FOR UPDATE locking to prevent race conditions
- Duplicate seat prevention at database level
- User-specific booking management
- Cancellation with automatic seat release and refunds
- Real-time available seat updates

✅ **Security**

- JWT token-based authentication
- Password hashing with bcryptjs (10 salt rounds)
- Authorization middleware on protected endpoints
- Transaction rollback on booking failures
- Input validation and error handling

## Tech Stack

- **Backend**: Express.js (Node.js)
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Environment**: dotenv

## Installation

### 1. Prerequisites

- Node.js 14+ and npm
- PostgreSQL 12+ running locally or on a server
- Git

### 2. Setup

**Clone the repository:**

```bash
git clone <repository-url>
cd bmc_pg/backend
```

**Install dependencies:**

```bash
npm install
```

**Configure environment:**
Create `.env` file with your database credentials:

```
PORT=8080
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=bmc_db

JWT_ACCESS_SECRET=your_super_secret_access_key_change_this_in_production_12345
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production_67890
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

**Create database and initialize schema:**

```bash
# Create the database
psql -h localhost -U postgres -c "CREATE DATABASE bmc_db;"

# Initialize tables and sample data
psql -h localhost -U postgres -d bmc_db -f ../postgress.session.sql
```

See `DATABASE_SETUP.md` for detailed database setup instructions.

### 3. Start the Server

**Development mode:**

```bash
npm start
```

**With auto-reload (requires nodemon):**

```bash
npm install --save-dev nodemon
npx nodemon server.js
```

Server will start at `http://localhost:8080`

## API Documentation

### Base URL

```
http://localhost:8080/api
```

### Authentication Endpoints

- **POST** `/auth/register` - Create new user account
- **POST** `/auth/login` - Get JWT tokens
- **POST** `/auth/refresh-token` - Refresh access token
- **POST** `/auth/logout` - Logout user
- **GET** `/auth/profile` - Get current user profile (requires token)
- **POST** `/auth/change-password` - Change user password (requires token)

See `AUTHENTICATION_GUIDE.md` for complete authentication examples.

### Movies Endpoints

- **GET** `/movies` - Get all movies
- **GET** `/movies/:id` - Get movie details

### Shows Endpoints

- **GET** `/shows` - Get all shows with availability
- **GET** `/shows/:id` - Get specific show details

### Bookings Endpoints

- **GET** `/bookings/shows/:showId/seats` - Get all seats for a show (with status)
- **POST** `/bookings/book` - Book seats (requires auth)
- **GET** `/bookings/my-bookings` - View user's bookings (requires auth)
- **POST** `/bookings/:bookingId/cancel` - Cancel booking (requires auth)

See `BOOKING_GUIDE.md` for complete booking examples and workflows.

## Project Structure

```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.controller.js      # Request handlers
│   │   ├── auth.service.js         # Business logic
│   │   ├── auth.model.js           # Database queries
│   │   ├── auth.middleware.js      # JWT verification
│   │   └── auth.routes.js          # API routes
│   ├── movies/
│   │   ├── movie.model.js
│   │   ├── movie.controller.js
│   │   └── movie.routes.js
│   ├── shows/
│   │   ├── show.model.js
│   │   ├── show.controller.js
│   │   └── show.routes.js
│   ├── booking/
│   │   ├── booking.service.js      # Transaction logic
│   │   ├── booking.controller.js
│   │   ├── booking.model.js
│   │   ├── seat.model.js
│   │   └── booking.routes.js
│   └── common/
│       └── config/
│           └── db.js               # PostgreSQL pool
├── server.js                        # Entry point
├── .env                            # Environment config
├── package.json
├── README.md                       # This file
├── AUTHENTICATION_GUIDE.md         # Auth documentation
├── BOOKING_GUIDE.md               # Booking documentation
└── DATABASE_SETUP.md              # Database setup guide
```

## Key Implementation Details

### Transaction-Based Seat Booking

The booking system uses PostgreSQL transactions with FOR UPDATE row locking to ensure:

1. **Atomicity** - Entire booking succeeds or fails completely
2. **Consistency** - No duplicate bookings of same seat
3. **Isolation** - Concurrent booking attempts don't interfere
4. **Durability** - Once committed, data is permanent

```javascript
// Example: Locking seats during booking
BEGIN;
SELECT * FROM seats WHERE id = ANY($1) FOR UPDATE;
-- Check availability
-- Update seats
-- Create booking record
-- Update available seats count
COMMIT; // or ROLLBACK on error
```

### JWT Token Flow

1. User registers → Password hashed and stored
2. User logs in → JWT access + refresh tokens returned
3. Frontend stores tokens (localStorage/SessionStorage)
4. Each request includes `Authorization: Bearer {accessToken}`
5. Token expires in 15 minutes
6. Use refresh token to get new access token (7 day expiry)

### Duplicate Seat Prevention

- Database-level unique constraint on (show_id, seat_number)
- Transaction-based FOR UPDATE lock prevents race conditions
- Seats marked as is_booked = TRUE after successful booking
- Attempting to book already-booked seat fails at database level

## Testing

### Using cURL

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"test123"}'

# Book seats (replace TOKEN with actual token)
curl -X POST http://localhost:8080/api/bookings/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"showId":1,"seatIds":[1,2,3]}'
```

### Using JavaScript (Postman, Frontend, etc.)

See `BOOKING_GUIDE.md` for complete JavaScript examples and workflow.

## Sample Data

Pre-populated database includes:

- **5 Movies**: The Dark Knight, Inception, The Shawshank Redemption, Avengers: Endgame, Parasite
- **3 Shows**: Multiple screenings at different times and prices
- **60 Seats**: 20 seats per show (A1-E4 format)

## Error Handling

All endpoints return standardized JSON responses:

**Success (2xx):**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    /* result */
  }
}
```

**Error (4xx/5xx):**

```json
{
  "success": false,
  "message": "Error description"
}
```

Common errors:

- `401 Unauthorized` - Missing or invalid token
- `400 Bad Request` - Invalid input or business logic error
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server error

## Security Considerations

⚠️ **Production Setup**

- Change JWT secrets in `.env` to strong random values
- Set `NODE_ENV=production`
- Use HTTPS only
- Implement rate limiting
- Add CORS configuration for specific domains
- Enable database SSL connections
- Use environment-specific `.env` files
- Implement request logging and monitoring
- Add API key rate limiting per user

## Development Notes

### Adding New Endpoints

1. Create model file (e.g., `entity.model.js`) for database queries
2. Create controller file (e.g., `entity.controller.js`) for request handlers
3. Create routes file (e.g., `entity.routes.js`) to wire everything
4. Import and use in `server.js`

### Database Migrations

To add new tables or columns:

1. Modify `postgress.session.sql`
2. Drop existing database: `dropdb -U postgres bmc_db`
3. Recreate: `createdb -U postgres bmc_db`
4. Reinitialize: `psql -U postgres -d bmc_db -f postgress.session.sql`

### Debugging

Enable detailed logs:

```javascript
// In any file
console.log("Debug info:", variable);
```

Check PostgreSQL logs:

```bash
tail -f /var/log/postgresql/postgresql.log
```

## Performance Optimizations

✅ Implemented:

- Database indexes on frequently queried columns
- Connection pooling (20 connections)
- Transaction timeout prevention
- Efficient SQL queries

📈 Future improvements:

- Caching layer (Redis) for show/movie data
- Query result pagination
- Database query optimization analysis
- Load testing and benchmarking

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and test thoroughly
3. Commit: `git commit -am 'Add feature'`
4. Push: `git push origin feature/name`
5. Create Pull Request

## License

MIT License - Feel free to use for personal and commercial projects.

## Support & Documentation

- **Authentication**: See `AUTHENTICATION_GUIDE.md`
- **Booking**: See `BOOKING_GUIDE.md`
- **Database**: See `DATABASE_SETUP.md`

## Troubleshooting

**Server won't start**

- Check `.env` file has correct database credentials
- Ensure PostgreSQL is running
- Check port 8080 is available

**Database connection errors**

- Verify PostgreSQL is installed and running
- Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in `.env`
- Try: `psql -h localhost -U postgres` to test connection

**Booking fails**

- Check show exists: `GET /api/shows`
- Check seats are available: `GET /api/bookings/shows/{showId}/seats`
- Ensure you have valid auth token
- Check user has booking permissions

**Token expired**

- Use refresh endpoint to get new token
- Save new token and use for next requests

---

Made with ❤️ for the Book My Show project
