-- Reset all data in the database
-- This migration clears existing data and inserts fresh sample data
-- Delete data in reverse order of foreign key dependencies
DELETE FROM bookings;
DELETE FROM seats;
DELETE FROM shows;
DELETE FROM movies;
DELETE FROM users;
-- Reset sequences
ALTER SEQUENCE movies_id_seq RESTART WITH 1;
ALTER SEQUENCE shows_id_seq RESTART WITH 1;
ALTER SEQUENCE seats_id_seq RESTART WITH 1;
ALTER SEQUENCE bookings_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1;
-- Insert fresh admin user
INSERT INTO users (email, password_hash, name, role, is_verified)
VALUES (
        'admin@bookmyticket.com',
        '$2b$12$3eKTTAbqffTzTF8ZWljLD.HEpvfR1BO0xmuz8HLJVL5haWPxLgXoS',
        'Admin User',
        'admin',
        TRUE
    );
-- Insert fresh sample movies
INSERT INTO movies (
        title,
        description,
        duration,
        genre,
        rating,
        poster_url,
        base_price
    )
VALUES (
        'The Dark Knight',
        'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        152,
        'Action',
        'PG-13',
        'https://m.media-amazon.com/images/I/81IfoBox2TL._AC_UF894,1000_QL80_.jpg',
        480.00
    ),
    (
        'Inception',
        'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        148,
        'Sci-Fi',
        'PG-13',
        'https://m.media-amazon.com/images/I/61gz2gcfkAL._AC_UF894,1000_QL80_.jpg',
        300.00
    ),
    (
        'Interstellar',
        'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.',
        169,
        'Sci-Fi',
        'PG-13',
        'https://image.tmdb.org/t/p/original/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        500.00
    ),
    (
        'The Avengers',
        'Earth''s mightiest heroes assemble to battle an alien invasion.',
        143,
        'Action',
        'PG-13',
        'https://m.media-amazon.com/images/I/81jFXcavSGL._AC_UF894,1000_QL80_.jpg',
        400.00
    ),
    (
        'Parasite',
        'Gripping story of class conflict and deception in modern society.',
        132,
        'Thriller',
        'R',
        'https://m.media-amazon.com/images/I/81jVkYFXz6L._AC_UF894,1000_QL80_.jpg',
        380.00
    );
-- Insert fresh sample shows
INSERT INTO shows (
        movie_id,
        show_time,
        screen_number,
        available_seats
    )
VALUES -- The Dark Knight
    (
        1,
        CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '14 hours',
        1,
        120
    ),
    (
        1,
        CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '19 hours',
        1,
        120
    ),
    -- Inception
    (
        2,
        CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '15 hours',
        2,
        120
    ),
    (
        2,
        CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '20 hours',
        2,
        120
    ),
    -- Interstellar
    (
        3,
        CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '16 hours',
        3,
        120
    ),
    (
        3,
        CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '21 hours',
        3,
        120
    ),
    -- The Avengers
    (
        4,
        CURRENT_TIMESTAMP + INTERVAL '4 days' + INTERVAL '10 hours',
        4,
        120
    ),
    (
        4,
        CURRENT_TIMESTAMP + INTERVAL '4 days' + INTERVAL '17 hours',
        4,
        120
    ),
    -- Parasite
    (
        5,
        CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '18 hours',
        5,
        120
    );
-- Insert fresh sample seats (8 rows x 15 seats per show)
DO $$
DECLARE show_record RECORD;
row_letters CHAR [] := ARRAY ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
row_char CHAR;
seat_num INTEGER;
seat_type_value VARCHAR(20);
multiplier_value DECIMAL(3, 2);
BEGIN FOR show_record IN
SELECT id
FROM shows LOOP FOREACH row_char IN ARRAY row_letters LOOP FOR seat_num IN 1..15 LOOP IF row_char = 'A' THEN seat_type_value := 'vip';
multiplier_value := 1.50;
ELSIF row_char = 'B'
AND (
    seat_num = 1
    OR seat_num = 15
) THEN seat_type_value := 'wheelchair';
multiplier_value := 1.00;
ELSE seat_type_value := 'regular';
multiplier_value := 1.00;
END IF;
INSERT INTO seats (
        show_id,
        row_letter,
        seat_number,
        isbooked,
        seat_type,
        price_multiplier
    )
VALUES (
        show_record.id,
        row_char,
        seat_num,
        FALSE,
        seat_type_value,
        multiplier_value
    );
END LOOP;
END LOOP;
END LOOP;
END $$;
-- Verify data
SELECT COUNT(*) as total_users
FROM users;
SELECT COUNT(*) as total_movies
FROM movies;
SELECT COUNT(*) as total_shows
FROM shows;
SELECT COUNT(*) as total_seats
FROM seats;