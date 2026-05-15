import { pool } from "../config/db.js";

export const ServiceStatus = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM service_statuses");
    return rows;
  },
  create: async (data) => {
    const [r] = await pool.query(
      "INSERT INTO service_statuses (status_name, description, created_at, updated_at) VALUES (?,?,NOW(),NOW())",
      [data.status_name, data.description]
    );
    return r.insertId;
  }
};