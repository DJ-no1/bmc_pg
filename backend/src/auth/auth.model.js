import pool from "../common/config/db.js";

class UserModel {
    static async createUser(email, passwordHash, name) {
        const query = `
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($1, $2, $3, 'user')
      RETURNING id, email, name, role, created_at;
    `;
        const result = await pool.query(query, [email, passwordHash, name]);
        return result.rows[0];
    }

    static async findByEmail(email) {
        const query = `
      SELECT id, email, password_hash, name, role, created_at, updated_at
      FROM users
      WHERE email = $1;
    `;
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }

    static async findById(id) {
        const query = `
      SELECT id, email, name, role, created_at, updated_at
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
}

export default UserModel;
