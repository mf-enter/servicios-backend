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
};