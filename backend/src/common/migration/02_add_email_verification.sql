-- Add email verification fields to users table
-- Run this migration to add support for email verification

ALTER TABLE users 
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_token VARCHAR(255),
ADD COLUMN verification_expires_at TIMESTAMP;

-- Update existing users to be verified (since they didn't go through verification flow)
UPDATE users SET is_verified = TRUE WHERE is_verified IS NULL;

-- Create index for faster token lookups
CREATE INDEX idx_users_verification_token ON users(verification_token);
