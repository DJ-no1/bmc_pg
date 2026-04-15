import pool from "../common/config/db.js";

class UserModel {
    static async createUser(email, passwordHash, name) {
        const query = `
      INSERT INTO users (email, password_hash, name, role, is_verified)
      VALUES ($1, $2, $3, 'user', FALSE)
      RETURNING id, email, name, role, is_verified, created_at;
    `;
        const result = await pool.query(query, [email, passwordHash, name]);
        return result.rows[0];
    }

    static async findByEmail(email) {
        const query = `
      SELECT id, email, password_hash, name, role, is_verified, verification_token, verification_expires_at, created_at, updated_at
      FROM users
      WHERE email = $1;
    `;
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }

    static async findById(id) {
        const query = `
      SELECT id, email, name, role, is_verified, created_at, updated_at
      FROM users
      WHERE id = $1;
    `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async emailExists(email) {
        const query = `
      SELECT EXISTS(SELECT 1 FROM users WHERE email = $1);
    `;
        const result = await pool.query(query, [email]);
        return result.rows[0].exists;
    }

    static async updatePassword(id, newPasswordHash) {
        const query = `
      UPDATE users
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email, name, role;
    `;
        const result = await pool.query(query, [newPasswordHash, id]);
        return result.rows[0];
    }

    static async saveVerificationToken(userId, token, expiresAt) {
        const query = `
      UPDATE users
      SET verification_token = $1, verification_expires_at = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, email, name, role, is_verified;
    `;
        const result = await pool.query(query, [token, expiresAt, userId]);
        return result.rows[0];
    }

    static async verifyEmail(token) {
        const query = `
      UPDATE users
      SET is_verified = TRUE, verification_token = NULL, verification_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE verification_token = $1 AND verification_expires_at > CURRENT_TIMESTAMP
      RETURNING id, email, name, role, is_verified;
    `;
        const result = await pool.query(query, [token]);
        return result.rows[0];
    }

    static async getVerificationToken(userId) {
        const query = `
      SELECT verification_token, verification_expires_at
      FROM users
      WHERE id = $1;
    `;
        const result = await pool.query(query, [userId]);
        return result.rows[0];
    }

    static async verifyUserEmail(userId) {
        const query = `
      UPDATE users
      SET is_verified = TRUE, verification_token = NULL, verification_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, name, role, is_verified;
    `;
        const result = await pool.query(query, [userId]);
        return result.rows[0];
    }
}

export default UserModel;
