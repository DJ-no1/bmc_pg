-- This migration hashes any plain text passwords
-- This is a temporary fix for users that were created without going through the registration flow
-- First, identify which passwords are likely plain text (shorter than 60 chars, bcrypt hashes are always 60 chars)
-- bcrypt hashes always start with $2a$, $2b$, $2y$, or $2x$ and are 60 characters long
-- Create a temporary column to store the old passwords
ALTER TABLE users
ADD COLUMN old_password_hash VARCHAR(255);
-- Back up the current passwords
UPDATE users
SET old_password_hash = password_hash
WHERE LENGTH(password_hash) < 60
    OR password_hash NOT LIKE '$2%';
-- Show users that need password hashing
SELECT id,
    email,
    password_hash
FROM users
WHERE old_password_hash IS NOT NULL;
-- Note: Manual hashing will be done via the Node.js script since SQL doesn't have bcrypt
-- See: 04_hash_passwords.js