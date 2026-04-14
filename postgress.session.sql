-- Complete Database Schema for Book My Show
-- Run this script with: psql -h localhost -U postgres -d bmc_db -f postgress.session.sql
-- Or first create the database: CREATE DATABASE bmc_db;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS shows CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS users CASCADE;
-- Users table (for authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Movies table (mocked data)
CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(100),
    rating DECIMAL(3, 1),
    release_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Shows table (specific movie screening at a time)
CREATE TABLE shows (
    id SERIAL PRIMARY KEY,
    movie_id INT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total_seats INT DEFAULT 20,
    available_seats INT DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(movie_id, show_date, show_time)
);
-- Seats table (individual seats in a show)
CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    show_id INT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    booked_by INT REFERENCES users(id) ON DELETE
    SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(show_id, seat_number)
);
-- Bookings table (user bookings)
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    show_id INT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    seat_ids INT [] NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    booking_status VARCHAR(50) DEFAULT 'confirmed' CHECK (
        booking_status IN ('pending', 'confirmed', 'cancelled')
    ),
    payment_status VARCHAR(50) DEFAULT 'completed' CHECK (
        payment_status IN ('pending', 'completed', 'failed')
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Insert sample movies
INSERT INTO movies (title, description, genre, rating, release_date)
VALUES (
        'The Dark Knight',
        'A gripping crime thriller',
        'Action',
        9.0,
        '2008-07-18'
    ),
    (
        'Inception',
        'A mind-bending science fiction film',
        'Sci-Fi',
        8.8,
        '2010-07-16'
    ),
    (
        'The Shawshank Redemption',
        'A timeless drama',
        'Drama',
        9.3,
        '1994-10-14'
    ),
    (
        'Avengers: Endgame',
        'The epic conclusion',
        'Action',
        8.4,
        '2019-04-26'
    ),
    (
        'Parasite',
        'A brilliant thriller',
        'Drama',
        8.6,
        '2019-05-30'
    );
-- Insert sample shows (for movie_id 1, show_id 1)
INSERT INTO shows (
        movie_id,
        show_date,
        show_time,
        price,
        total_seats,
        available_seats
    )
VALUES (
        1,
        CURRENT_DATE + INTERVAL '1 day',
        '10:00',
        250.00,
        20,
        20
    ),
    (
        1,
        CURRENT_DATE + INTERVAL '1 day',
        '14:00',
        300.00,
        20,
        20
    ),
    (
        2,
        CURRENT_DATE + INTERVAL '2 days',
        '18:00',
        350.00,
        20,
        20
    );
-- Insert sample seats (for show_id 1 - Movie 1, 10:00 AM)
INSERT INTO seats (show_id, seat_number, is_booked)
SELECT 1,
    chr(65 + (s / 5)) || ((s % 5) + 1)::TEXT,
    FALSE
FROM generate_series(0, 19) AS s;
-- Insert sample seats (for show_id 2 - Movie 1, 2:00 PM)
INSERT INTO seats (show_id, seat_number, is_booked)
SELECT 2,
    chr(65 + (s / 5)) || ((s % 5) + 1)::TEXT,
    FALSE
FROM generate_series(0, 19) AS s;
-- Insert sample seats (for show_id 3 - Movie 2, 6:00 PM)
INSERT INTO seats (show_id, seat_number, is_booked)
SELECT 3,
    chr(65 + (s / 5)) || ((s % 5) + 1)::TEXT,
    FALSE
FROM generate_series(0, 19) AS s;
-- Create performance indexes
CREATE INDEX idx_seats_show_id ON seats(show_id);
CREATE INDEX idx_seats_is_booked ON seats(is_booked);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_show_id ON bookings(show_id);
CREATE INDEX idx_shows_movie_id ON shows(movie_id);