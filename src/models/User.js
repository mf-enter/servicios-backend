import { pool } from "../config/db.js";

export const User = {
  findByEmail: async (email) => {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0];
  },
  findAll: async () => {
    const [rows] = await pool.query("SELECT user_id,name,lastname,email,is_active,user_type_id FROM users");
    return rows;
  },
  findById: async (id) => {
    const [rows] = await pool.query("SELECT * FROM users WHERE user_id = ?", [id]);
    return rows[0];
  },
  create: async (data, db = pool) => {
    const [result] = await db.query(
      "INSERT INTO users (name, lastname, email, password, user_type_id, is_active, created_at, updated_at) VALUES (?,?,?,?,?,1,NOW(),NOW())",
      [data.name, data.lastname, data.email, data.password, data.user_type_id]
    );
    return result.insertId;
  },
  update: async (id, data) => {
    await pool.query(
      "UPDATE users SET name=?, lastname=?, email=?, user_type_id=?, updated_at=NOW() WHERE user_id=?",
      [data.name, data.lastname, data.email, data.user_type_id, id]
    );
  },
  remove: async (id) => {
    await pool.query("DELETE FROM users WHERE user_id=?", [id]);
  }
};