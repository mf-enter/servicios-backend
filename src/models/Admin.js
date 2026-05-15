import { pool } from "../config/db.js";

export const Admin = {
  findById: async (id) => {
    const [rows] = await pool.query("SELECT * FROM admins WHERE admin_id = ?", [id]);
    return rows[0];
  },
  findByEmail: async (email) => {
    const [rows] = await pool.query("SELECT * FROM admins WHERE email = ?", [email]);
    return rows[0];
  },
  create: async (data, db = pool) => {
    const [result] = await db.query(
      "INSERT INTO admins (name, lastname, email, password, is_active, created_at, updated_at) VALUES (?,?,?,?,1,NOW(),NOW())",
      [data.name, data.lastname, data.email, data.password]
    );
    return result.insertId;
  }
};