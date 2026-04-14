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
  return {
    show: {
      id: show.id,
      movieTitle: show.movieTitle,
      showDate: show.show_date,
      showTime: show.show_time,
      price: show.price,
      availableSeats: show.available_seats,
    },
    seats: seats.map(s => ({
      id: s.id,
      seatNumber: s.seat_number,
      isBooked: s.is_booked,
    })),
  };
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
    const seatsData = await BookingModel.getMultipleSeats(uniqueSeatIds);

    if (seatsData.length !== uniqueSeatIds.length) {
      throw new Error("One or more seats not found");
    }

    const allSameShow = seatsData.every(s => s.show_id === showId);
    if (!allSameShow) {
      throw new Error("All seats must be from the same show");
    }

    const bookedSeats = seatsData.filter(s => s.is_booked);
    if (bookedSeats.length > 0) {
      const bookedNumbers = bookedSeats.map(s => s.seat_number).join(", ");
      throw new Error(`Seats already booked: ${bookedNumbers}`);
    }

    // Book each seat
    const bookedSeatsResult = [];
    for (const seatId of uniqueSeatIds) {
      const result = await BookingModel.bookSeat(conn, seatId, userId);
      if (!result) throw new Error(`Failed to book seat ${seatId}`);
      bookedSeatsResult.push(result);
    }

    // Create booking record
    const totalPrice = show.price * uniqueSeatIds.length;
    const booking = await BookingModel.createBooking(
      userId, showId, uniqueSeatIds, totalPrice
    );

    // Update available seats
    const newAvailableSeats = show.available_seats - uniqueSeatIds.length;
    await BookingModel.updateAvailableSeats(showId, newAvailableSeats);

    await conn.query("COMMIT");

    return {
      bookingId: booking.id,
      userId: booking.user_id,
      showId: booking.show_id,
      bookedSeats: bookedSeatsResult.map(s => s.seat_number),
      totalPrice: booking.total_price,
      bookingStatus: booking.booking_status,
      createdAt: booking.created_at,
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
    showDate: b.show_date,
    showTime: b.show_time,
    bookedSeats: b.seat_ids,
    totalPrice: b.total_price,
    bookingStatus: b.booking_status,
  }));
};

// ===== CANCEL BOOKING =====
export const cancelBooking = async (userId, bookingId) => {
  const booking = await BookingModel.getBookingById(bookingId);

  if (!booking) throw new Error("Booking not found");
  if (booking.user_id !== userId) {
    throw new Error("Unauthorized to cancel this booking");
  }
  if (booking.booking_status === "cancelled") {
    throw new Error("Booking is already cancelled");
  }

  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");

    // Cancel booking
    await BookingModel.cancelBookingDb(bookingId);

    // Release seats
    const releaseQuery = `
      UPDATE seats SET is_booked = FALSE, booked_by = NULL
      WHERE id = ANY($1)`;
    await conn.query(releaseQuery, [booking.seat_ids]);

    // Update available seats
    const show = await BookingModel.getShowById(booking.show_id);
    const newAvailableSeats = show.available_seats + booking.seat_ids.length;
    await BookingModel.updateAvailableSeats(booking.show_id, newAvailableSeats);

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
