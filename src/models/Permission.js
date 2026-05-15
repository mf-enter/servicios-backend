import { pool } from "../config/db.js";

export const Permission = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM permissions");
    return rows;
  },
  create: async (data) => {
    const [r] = await pool.query(
      "INSERT INTO permissions (permission_name, description, module, created_at, updated_at) VALUES (?,?,?,NOW(),NOW())",
      [data.permission_name, data.description, data.module]
    );
    return r.insertId;
  },
  userHasPermission: async (userId, permName) => {
    const [rows] = await pool.query(`
      SELECT p.permission_id
      FROM permissions p
      JOIN role_permissions rp ON rp.permission_id = p.permission_id
      JOIN user_roles ur ON ur.role_id = rp.role_id
      WHERE ur.user_id = ? AND p.permission_name = ?
      LIMIT 1
    `, [userId, permName]);
    return rows.length > 0;
  }
};