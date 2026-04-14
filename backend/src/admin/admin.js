import express from "express";
import pool from "../common/config/db.js";
import { authenticateToken } from "../auth/auth.middleware.js";

const router = express.Router();

// ===== ADMIN MIDDLEWARE =====
const authenticateAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const query = "SELECT role FROM users WHERE id = $1";
    const result = await pool.query(query, [req.user.id]);

    if (result.rows.length === 0 || result.rows[0].role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===== MOVIE HANDLERS =====
const createMovie = async (req, res) => {
  try {
    const { title, description, genre, rating, releaseDate } = req.body;

    if (!title || !description || !genre || !rating) {
      return res.status(400).json({
        success: false,
        error: "Title, description, genre, and rating are required",
      });
    }

    if (rating < 0 || rating > 10) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 0 and 10",
      });
    }

    const query = `
      INSERT INTO movies (title, description, genre, rating, release_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`;
    const result = await pool.query(query, [title, description, genre, rating, releaseDate]);

    res.status(201).json({
      success: true,
      message: "Movie created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, genre, rating, releaseDate } = req.body;

    if (rating && (rating < 0 || rating > 10)) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 0 and 10",
      });
    }

    const query = `
      UPDATE movies
      SET title = COALESCE($2, title),
          description = COALESCE($3, description),
          genre = COALESCE($4, genre),
          rating = COALESCE($5, rating),
          release_date = COALESCE($6, release_date)
      WHERE id = $1
      RETURNING *`;
    const result = await pool.query(query, [id, title, description, genre, rating, releaseDate]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Movie not found" });
    }

    res.json({
      success: true,
      message: "Movie updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;

    const query = "DELETE FROM movies WHERE id = $1 RETURNING *";
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Movie not found" });
    }

    res.json({
      success: true,
      message: "Movie deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===== SHOW HANDLERS =====
const createShow = async (req, res) => {
  try {
    const { movieId, showDate, showTime, price } = req.body;

    if (!movieId || !showDate || !showTime || !price) {
      return res.status(400).json({
        success: false,
        error: "Movie ID, show date, show time, and price are required",
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        error: "Price must be greater than 0",
      });
    }

    // Validate movie exists
    const movieQuery = "SELECT id FROM movies WHERE id = $1";
    const movieResult = await pool.query(movieQuery, [movieId]);
    if (movieResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Movie not found" });
    }

    // Create show with seats in transaction
    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

      // Create show
      const showQuery = `
        INSERT INTO shows (movie_id, show_date, show_time, price, available_seats)
        VALUES ($1, $2, $3, $4, 20)
        RETURNING id`;
      const showResult = await conn.query(showQuery, [movieId, showDate, showTime, price]);
      const showId = showResult.rows[0].id;

      // Create seats (A1-E4 = 5 rows × 4 columns)
      const seatQuery = `
        INSERT INTO seats (show_id, seat_number)
        SELECT $1, seat_num
        FROM (
          SELECT chr(64 + row_num) || col_num::text AS seat_num
          FROM generate_series(1, 5) AS t1(row_num)
          CROSS JOIN generate_series(1, 4) AS t2(col_num)
        ) AS generated_seats`;
      await conn.query(seatQuery, [showId]);

      await conn.query("COMMIT");

      res.status(201).json({
        success: true,
        message: "Show created successfully with 20 seats",
        data: {
          id: showId,
          movieId,
          showDate,
          showTime,
          price,
          availableSeats: 20,
        },
      });
    } catch (error) {
      await conn.query("ROLLBACK");
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateShow = async (req, res) => {
  try {
    const { id } = req.params;
    const { showDate, showTime, price } = req.body;

    if (price && price <= 0) {
      return res.status(400).json({
        success: false,
        error: "Price must be greater than 0",
      });
    }

    const query = `
      UPDATE shows
      SET show_date = COALESCE($2, show_date),
          show_time = COALESCE($3, show_time),
          price = COALESCE($4, price)
      WHERE id = $1
      RETURNING *`;
    const result = await pool.query(query, [id, showDate, showTime, price]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Show not found" });
    }

    res.json({
      success: true,
      message: "Show updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteShow = async (req, res) => {
  try {
    const { id } = req.params;

    const query = "DELETE FROM shows WHERE id = $1 RETURNING *";
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Show not found" });
    }

    res.json({
      success: true,
      message: "Show deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===== ADMIN MANAGEMENT HANDLERS =====
const grantAdminAccess = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const query = `
      UPDATE users SET role = 'admin' WHERE id = $1
      RETURNING id, email, name, role`;
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({
      success: true,
      message: "Admin access granted",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const revokeAdminAccess = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const query = `
      UPDATE users SET role = 'user' WHERE id = $1
      RETURNING id, email, name, role`;
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({
      success: true,
      message: "Admin access revoked",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===== ROUTES =====
// Movie management (admin only)
router.post("/movies", authenticateToken, authenticateAdmin, createMovie);
router.put("/movies/:id", authenticateToken, authenticateAdmin, updateMovie);
router.delete("/movies/:id", authenticateToken, authenticateAdmin, deleteMovie);

// Show management (admin only)
router.post("/shows", authenticateToken, authenticateAdmin, createShow);
router.put("/shows/:id", authenticateToken, authenticateAdmin, updateShow);
router.delete("/shows/:id", authenticateToken, authenticateAdmin, deleteShow);

// Admin management (admin only)
router.post("/grant-admin/:userId", authenticateToken, authenticateAdmin, grantAdminAccess);
router.post("/revoke-admin/:userId", authenticateToken, authenticateAdmin, revokeAdminAccess);

export default router;
