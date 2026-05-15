import { pool } from "../config/db.js";

export const AdminLog = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM admin_logs ORDER BY log_id DESC");
    return rows;
  },
  create: async ({ admin_user_id, action, entity_type, entity_id, changes, ip_address, user_agent }) => {
    await pool.query(
      `INSERT INTO admin_logs (admin_user_id, action, entity_type, entity_id, changes, ip_address, user_agent, created_at)
       VALUES (?,?,?,?,?,?,?,NOW())`,
      [admin_user_id, action, entity_type, entity_id, changes, ip_address, user_agent]
    );
  }
};