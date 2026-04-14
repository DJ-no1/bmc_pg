import * as BookingService from "./booking.service.js";

// ===== MOVIES =====
export const getMovies = async (req, res) => {
  try {
    const movies = await BookingService.getMovies();
    res.json({ success: true, data: movies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await BookingService.getMovieById(id);
    if (!movie) {
      return res.status(404).json({ success: false, error: "Movie not found" });
    }
    res.json({ success: true, data: movie });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===== SHOWS =====
export const getShows = async (req, res) => {
  try {
    const shows = await BookingService.getShows();
    res.json({ success: true, data: shows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getShowById = async (req, res) => {
  try {
    const { id } = req.params;
    const show = await BookingService.getShowById(id);
    if (!show) {
      return res.status(404).json({ success: false, error: "Show not found" });
    }
    res.json({ success: true, data: show });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===== SEATS =====
export const getSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const seatsData = await BookingService.getSeatsForShow(showId);
    res.json({ success: true, data: seatsData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===== BOOKINGS =====
export const bookSeats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { showId, seatIds } = req.body;

    if (!showId || !seatIds) {
      return res.status(400).json({
        success: false,
        error: "showId and seatIds are required",
      });
    }

    const booking = await BookingService.bookSeats(userId, showId, seatIds);
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await BookingService.getUserBookings(userId);
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId } = req.params;

    const result = await BookingService.cancelBooking(userId, bookingId);
    res.json({ success: true, data: result });
  } catch (error) {
    const status = error.message === "Unauthorized to cancel this booking" ? 403 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
};
