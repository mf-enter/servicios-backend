import { pool } from "../config/db.js";

export const Role = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM roles");
    return rows;
  },
  create: async (data) => {
    const [r] = await pool.query(
      "INSERT INTO roles (role_name, description, is_admin, created_at, updated_at) VALUES (?,?,?,NOW(),NOW())",
      [data.role_name, data.description, data.is_admin]
    );
    return r.insertId;
  }
};