import { pool } from "../config/db.js";

export const ServiceHistory = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM service_status_history");
    return rows;
  },
  create: async (data) => {
    const [r] = await pool.query(
      "INSERT INTO service_status_history (service_id, status_id, changed_by_user_id, changed_at, notes) VALUES (?,?,?,NOW(),?)",
      [data.service_id, data.status_id, data.changed_by_user_id, data.notes]
    );
    return r.insertId;
  }
};