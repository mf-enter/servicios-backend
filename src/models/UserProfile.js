import { pool } from "../config/db.js";

export const UserProfile = {
  findByUserId: async (userId) => {
    const [rows] = await pool.query("SELECT * FROM user_profiles WHERE user_id = ?", [userId]);
    return rows[0];
  },
  create: async (userId, avatar_url = null) => {
    const [r] = await pool.query(
      "INSERT INTO user_profiles (user_id, avatar_url, created_at, updated_at) VALUES (?,?,NOW(),NOW())",
      [userId, avatar_url]
    );
    return r.insertId;
  },
  updateAvatar: async (userId, avatar_url) => {
    await pool.query("UPDATE user_profiles SET avatar_url=?, updated_at=NOW() WHERE user_id=?", [avatar_url, userId]);
  }
};