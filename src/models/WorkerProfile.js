import { pool } from "../config/db.js";

export const WorkerProfile = {
  findAll: async () => {
    const [rows] = await pool.query(`
      SELECT u.user_id, u.name, u.lastname, u.email,
             wp.bio, wp.hourly_rate, wp.experience_years, wp.is_verified
      FROM users u
      LEFT JOIN worker_profiles wp ON u.user_id = wp.user_id
      WHERE u.user_type_id = 3
    `);
    return rows;
  },
  create: async (userId, db = pool) => {
    const [result] = await db.query(
      "INSERT INTO worker_profiles (user_id) VALUES (?)",
      [userId]
    );
    return result.insertId;
  }
  ,
  findByUserId: async (userId) => {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.name, u.lastname, u.email,
             wp.bio, wp.hourly_rate, wp.experience_years, wp.is_verified
       FROM users u
       LEFT JOIN worker_profiles wp ON u.user_id = wp.user_id
       WHERE u.user_id = ? AND u.user_type_id = 3
       LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },
  update: async (userId, data) => {
    // Ensure a profile row exists
    const [rows] = await pool.query("SELECT * FROM worker_profiles WHERE user_id = ?", [userId]);
    if (rows.length === 0) {
      await pool.query("INSERT INTO worker_profiles (user_id, bio, hourly_rate, experience_years, is_verified, created_at, updated_at) VALUES (?,?,?,?,0,NOW(),NOW())", [userId, data.bio ?? null, data.hourly_rate ?? null, data.experience_years ?? null]);
      return;
    }
    await pool.query(
      "UPDATE worker_profiles SET bio=?, hourly_rate=?, experience_years=?, updated_at=NOW() WHERE user_id=?",
      [data.bio ?? null, data.hourly_rate ?? null, data.experience_years ?? null, userId]
    );
  }
};