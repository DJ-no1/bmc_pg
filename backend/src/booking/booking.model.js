import pool from "../common/config/db.js";

// ===== MOVIES =====
export const getMovies = async () => {
  const query = `
    SELECT id, title, description, genre, rating, release_date
    FROM movies ORDER BY title`;
  const result = await pool.query(query);
  return result.rows;
};

export const getMovieById = async (id) => {
  const query = "SELECT * FROM movies WHERE id = $1";
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// ===== SHOWS =====
export const getShows = async () => {
  const query = `
    SELECT s.id, s.movie_id, m.title as movieTitle, 
           s.show_date, s.show_time, s.price, s.available_seats
    FROM shows s
    JOIN movies m ON s.movie_id = m.id
    ORDER BY s.show_date, s.show_time`;
  const result = await pool.query(query);
  return result.rows;
};

export const getShowById = async (id) => {
  const query = `
    SELECT s.id, s.movie_id, m.title as movieTitle,
           s.show_date, s.show_time, s.price, s.available_seats
    FROM shows s
    JOIN movies m ON s.movie_id = m.id
    WHERE s.id = $1`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const updateAvailableSeats = async (showId, newCount) => {
  const query = "UPDATE shows SET available_seats = $1 WHERE id = $2";
  await pool.query(query, [newCount, showId]);
};

// ===== SEATS =====
export const getSeatsByShowId = async (showId) => {
  const query = `
    SELECT id, seat_number, is_booked
    FROM seats WHERE show_id = $1 ORDER BY seat_number`;
  const result = await pool.query(query, [showId]);
  return result.rows;
};

export const getMultipleSeats = async (seatIds) => {
  if (!seatIds.length) return [];
  const placeholders = seatIds.map((_, i) => `$${i + 1}`).join(",");
  const query = `
    SELECT id, show_id, seat_number, is_booked
    FROM seats WHERE id IN (${placeholders})
    FOR UPDATE`;
  const result = await pool.query(query, seatIds);
  return result.rows;
};

export const bookSeat = async (conn, seatId, userId) => {
  const query = `
    UPDATE seats SET is_booked = TRUE, booked_by = $1
    WHERE id = $2 AND is_booked = FALSE
    RETURNING seat_number`;
  const result = await conn.query(query, [userId, seatId]);
  return result.rows[0];
};

// ===== BOOKINGS =====
export const createBooking = async (userId, showId, seatIds, totalPrice) => {
  const query = `
    INSERT INTO bookings (user_id, show_id, seat_ids, total_price, booking_status)
    VALUES ($1, $2, $3, $4, 'confirmed')
    RETURNING *`;
  const result = await pool.query(query, [userId, showId, seatIds, totalPrice]);
  return result.rows[0];
};

export const getUserBookings = async (userId) => {
  const query = `
    SELECT b.id, m.title, s.show_date, s.show_time,
           b.seat_ids, b.total_price, b.booking_status
    FROM bookings b
    JOIN shows s ON b.show_id = s.id
    JOIN movies m ON s.movie_id = m.id
    WHERE b.user_id = $1
    ORDER BY s.show_date DESC`;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

export const getBookingById = async (bookingId) => {
  const query = "SELECT * FROM bookings WHERE id = $1";
  const result = await pool.query(query, [bookingId]);
  return result.rows[0];
};

export const cancelBookingDb = async (bookingId) => {
  const query = `
    UPDATE bookings SET booking_status = 'cancelled'
    WHERE id = $1 RETURNING *`;
  const result = await pool.query(query, [bookingId]);
  return result.rows[0];
};

export const releaseSeat = async (conn, seatId) => {
  const query = `
    UPDATE seats SET is_booked = FALSE, booked_by = NULL WHERE id = $1`;
  await conn.query(query, [seatId]);
};
