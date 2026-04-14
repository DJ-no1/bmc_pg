import express from "express";
import { authenticateToken } from "../auth/auth.middleware.js";
import * as BookingController from "./booking.controller.js";

const router = express.Router();

// ===== MOVIES (public) =====
router.get("/movies", BookingController.getMovies);
router.get("/movies/:id", BookingController.getMovieById);

// ===== SHOWS (public) =====
router.get("/shows", BookingController.getShows);
router.get("/shows/:id", BookingController.getShowById);

// ===== SEATS (public) =====
router.get("/shows/:showId/seats", BookingController.getSeats);

// ===== BOOKINGS (protected) =====
router.post("/bookings", authenticateToken, BookingController.bookSeats);
router.get("/my-bookings", authenticateToken, BookingController.getMyBookings);
router.delete("/bookings/:bookingId", authenticateToken, BookingController.cancelBooking);

export default router;
