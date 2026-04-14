-- Book My Ticket - Complete Database Schema

DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS shows CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


--checking stuff

SELECT * FROM users;
SELECT * FROM movies;
SeLECT * FROM shows;
SELECT * FROM seats;
SELECT * FROM bookings;



-- Movies table
CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- in minutes
    genre VARCHAR(100),
    rating VARCHAR(10), -- PG, PG-13, R, etc.
    poster_url TEXT,
    base_price DECIMAL(10, 2) NOT NULL, -- base price for regular seats
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shows table
CREATE TABLE shows (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    show_time TIMESTAMP NOT NULL,
    screen_number INTEGER NOT NULL,
    available_seats INTEGER DEFAULT 120,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(movie_id, show_time, screen_number)
);

-- Seats table
CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    row_letter CHAR(1) NOT NULL, -- A, B, C, D, E, F, G, H
    seat_number INTEGER NOT NULL, -- 1-15
    isbooked BOOLEAN DEFAULT FALSE,
    seat_type VARCHAR(20) DEFAULT 'regular' CHECK (seat_type IN ('regular', 'vip', 'wheelchair')),
    price_multiplier DECIMAL(3, 2) DEFAULT 1.00, -- VIP: 1.50, Regular: 1.00, Wheelchair: 1.00
    UNIQUE(show_id, row_letter, seat_number)
);

-- Bookings table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seat_id INTEGER NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancellation_time TIMESTAMP,
    total_price DECIMAL(10, 2) NOT NULL,
    UNIQUE(seat_id)
);

-- indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_shows_movie_id ON shows(movie_id);
CREATE INDEX idx_seats_show_id ON seats(show_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_show_id ON bookings(show_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Create admin user
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@bookmyticket.com', '$2b$12$3eKTTAbqffTzTF8ZWljLD.HEpvfR1BO0xmuz8HLJVL5haWPxLgXoS', 'Admin User', 'admin');






INSERT INTO movies (title, description, duration, genre, rating, poster_url, base_price) VALUES
('The Dark Knight', 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.', 152, 'Action', 'PG-13', 'https://m.media-amazon.com/images/I/81IfoBox2TL._AC_UF894,1000_QL80_.jpg', 480.00),
('Inception', 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', 148, 'Sci-Fi', 'PG-13', 'https://m.media-amazon.com/images/I/61gz2gcfkAL._AC_UF894,1000_QL80_.jpg', 300.00),
('Interstellar', 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.', 169, 'Sci-Fi', 'PG-13', 'https://image.tmdb.org/t/p/original/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', 500.00);

INSERT INTO shows (movie_id, show_time, screen_number, available_seats) VALUES
-- The Dark Knight shows
(1, CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '14 hours', 1, 120),
(1, CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '19 hours', 1, 120),
-- Inception shows
(2, CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '15 hours', 2, 120),
(2, CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '20 hours', 2, 120),
-- Interstellar shows
(3, CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '16 hours', 3, 120),
(3, CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '21 hours', 3, 120);

DO $$
DECLARE
    show_record RECORD;
    row_letters CHAR[] := ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    row_char CHAR;
    seat_num INTEGER;
    seat_type_value VARCHAR(20);
    multiplier_value DECIMAL(3, 2);
BEGIN
    FOR show_record IN SELECT id FROM shows LOOP
        FOREACH row_char IN ARRAY row_letters LOOP
            FOR seat_num IN 1..15 LOOP
                IF row_char = 'A' THEN
                    seat_type_value := 'vip';
                    multiplier_value := 1.50;
                ELSIF row_char = 'B' AND (seat_num = 1 OR seat_num = 15) THEN
                    seat_type_value := 'wheelchair';
                    multiplier_value := 1.00;
                ELSE
                    seat_type_value := 'regular';
                    multiplier_value := 1.00;
                END IF;

                INSERT INTO seats (show_id, row_letter, seat_number, isbooked, seat_type, price_multiplier)
                VALUES (show_record.id, row_char, seat_num, FALSE, seat_type_value, multiplier_value);
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Database setup complete!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_movies FROM movies;
SELECT COUNT(*) as total_shows FROM shows;
SELECT COUNT(*) as total_seats FROM seats;