import pool from "../common/config/db.js";
import * as BookingModel from "./booking.model.js";

// ===== MOVIES & SHOWS =====
export const getMovies = () => BookingModel.getMovies();
export const getMovieById = (id) => BookingModel.getMovieById(id);
export const getShows = () => BookingModel.getShows();
export const getShowById = (id) => BookingModel.getShowById(id);

// ===== SEATS =====
export const getSeatsForShow = async (showId) => {
  const show = await BookingModel.getShowById(showId);
  if (!show) throw new Error("Show not found");

  const seats = await BookingModel.getSeatsByShowId(showId);
  return seats.map(s => ({
    id: s.id,
    row: s.row_letter,
    seat_number: s.seat_number,
    is_booked: s.isbooked,
    seat_type: s.seat_type,
    price_multiplier: s.price_multiplier,
  }));
};

// ===== BOOKING WITH TRANSACTION =====
export const bookSeats = async (userId, showId, seatIds) => {
  if (!seatIds || seatIds.length === 0) {
    throw new Error("At least one seat must be selected");
  }

  const uniqueSeatIds = [...new Set(seatIds)];
  const show = await BookingModel.getShowById(showId);

  if (!show) throw new Error("Show not found");
  if (uniqueSeatIds.length > show.available_seats) {
    throw new Error(`Only ${show.available_seats} seats available`);
  }

  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");

    // Lock and verify seats
    const seatsData = await BookingModel.getMultipleSeats(conn, uniqueSeatIds);

    if (seatsData.length !== uniqueSeatIds.length) {
      throw new Error("One or more seats not found");
    }

    const allSameShow = seatsData.every(s => s.show_id === showId);
    if (!allSameShow) {
      throw new Error("All seats must be from the same show");
    }

    const bookedSeats = seatsData.filter(s => s.isbooked);
    if (bookedSeats.length > 0) {
      const bookedSeatInfo = bookedSeats.map(s => `${s.row_letter}${s.seat_number}`).join(", ");
      throw new Error(`Seats already booked: ${bookedSeatInfo}`);
    }

    // Book each seat and create individual bookings
    const bookings = [];
    for (let i = 0; i < uniqueSeatIds.length; i++) {
      const seatId = uniqueSeatIds[i];
      const seat = seatsData[i];

      // Book the seat
      await BookingModel.bookSeat(conn, seatId);

      // Calculate price based on base price and multiplier
      const basePrice = 480; // Default from schema, could fetch from movie
      const seatPrice = basePrice * seat.price_multiplier;

      // Create booking record for this seat
      const booking = await BookingModel.createBooking(conn, userId, seatId, showId, seatPrice);
      bookings.push(booking);
    }

    // Update available seats
    const newAvailableSeats = show.available_seats - uniqueSeatIds.length;
    await BookingModel.updateAvailableSeats(conn, showId, newAvailableSeats);

    await conn.query("COMMIT");

    return {
      bookings: bookings.map(b => ({
        bookingId: b.id,
        seatId: b.seat_id,
        userId: b.user_id,
        showId: b.show_id,
        totalPrice: b.total_price,
        status: b.status,
        bookingTime: b.booking_time,
      })),
      totalAmount: bookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0),
    };
  } catch (error) {
    await conn.query("ROLLBACK");
    throw error;
  } finally {
    conn.release();
  }
};

// ===== USER BOOKINGS =====
export const getUserBookings = async (userId) => {
  const bookings = await BookingModel.getUserBookings(userId);
  return bookings.map(b => ({
    bookingId: b.id,
    movieTitle: b.title,
    showTime: b.show_time,
    screenNumber: b.screen_number,
    seatInfo: `${b.row_letter}${b.seat_number}`,
    totalPrice: b.total_price,
    status: b.status,
    bookingTime: b.booking_time,
  }));
};

// ===== CANCEL BOOKING =====
export const cancelBooking = async (userId, bookingId) => {
  const booking = await BookingModel.getBookingById(bookingId);

  if (!booking) throw new Error("Booking not found");
  if (booking.user_id !== userId) {
    throw new Error("Unauthorized to cancel this booking");
  }
  if (booking.status === "cancelled") {
    throw new Error("Booking is already cancelled");
  }

  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");

    // Cancel booking and release seat in one call
    await BookingModel.cancelBookingDb(conn, bookingId);
    await BookingModel.releaseSeat(conn, booking.seat_id);

    // Update available seats
    const show = await BookingModel.getShowById(booking.show_id);
    const newAvailableSeats = show.available_seats + 1;
    await BookingModel.updateAvailableSeats(conn, booking.show_id, newAvailableSeats);

    await conn.query("COMMIT");

    return {
      message: "Booking cancelled successfully",
      refundAmount: booking.total_price,
    };
  } catch (error) {
    await conn.query("ROLLBACK");
    throw error;
  } finally {
    conn.release();
  }
};
