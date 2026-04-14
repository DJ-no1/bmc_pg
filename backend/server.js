import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./src/auth/auth.routes.js";
import bookingRoutes from "./src/booking/booking.routes.js";
import adminRoutes from "./src/admin/admin.js";

import { authenticateToken } from "./src/auth/auth.middleware.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 8080;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "🎬 Book My Show API - Full System",
    version: "1.0.0",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        refreshToken: "POST /api/auth/refresh-token",
        logout: "POST /api/auth/logout",
        getProfile: "GET /api/auth/profile (requires token)",
        changePassword: "POST /api/auth/change-password (requires token)",
      },
      bookings: {
        movies: {
          getAllMovies: "GET /api/bookings/movies",
          getMovieById: "GET /api/bookings/movies/:id",
        },
        shows: {
          getAllShows: "GET /api/bookings/shows",
          getShowById: "GET /api/bookings/shows/:id",
        },
        seats: {
          getSeatsForShow: "GET /api/bookings/shows/:showId/seats",
        },
        book: {
          bookSeats: "POST /api/bookings/bookings (requires token)",
          getUserBookings: "GET /api/bookings/my-bookings (requires token)",
          cancelBooking: "DELETE /api/bookings/bookings/:bookingId (requires token)",
        },
      },
      admin: {
        movies: {
          createMovie: "POST /api/admin/movies (requires admin)",
          updateMovie: "PUT /api/admin/movies/:id (requires admin)",
          deleteMovie: "DELETE /api/admin/movies/:id (requires admin)",
        },
        shows: {
          createShow: "POST /api/admin/shows (requires admin)",
          updateShow: "PUT /api/admin/shows/:id (requires admin)",
          deleteShow: "DELETE /api/admin/shows/:id (requires admin)",
        },
        admin: {
          grantAdminAccess: "POST /api/admin/grant-admin/:userId (requires admin)",
          revokeAdminAccess: "POST /api/admin/revoke-admin/:userId (requires admin)",
        },
      },
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

app.listen(port, () => {
  console.log("╔════════════════════════════════════════╗");
  console.log("║   🎬 Book My Ticket API Server         ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`Server running on port: ${port}`);
  console.log(`API Base URL: http://localhost:${port}/api`);
  console.log(`Health Check: http://localhost:${port}/api/health`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("════════════════════════════════════════");
});
