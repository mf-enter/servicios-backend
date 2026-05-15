import { pool } from "../config/db.js";

export const RolePermission = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM role_permissions");
    return rows;
  },
  create: async (data) => {
    const [r] = await pool.query(
      "INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES (?,?,NOW())",
      [data.role_id, data.permission_id]
    );
    return r.insertId;
  }
};