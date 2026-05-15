import { pool } from "../config/db.js";

export const UserRole = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM user_roles");
    return rows;
  },
  create: async (data) => {
    const [r] = await pool.query(
      "INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?,?,NOW())",
      [data.user_id, data.role_id]
    );
    return r.insertId;
  }
};