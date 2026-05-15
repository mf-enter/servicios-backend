import { pool } from "../config/db.js";

export const ServiceType = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM service_types");
    return rows;
  },
  findById: async (id) => {
    const [rows] = await pool.query("SELECT * FROM service_types WHERE service_type_id = ?", [id]);
    return rows[0];
  },
  create: async (data) => {
    const [r] = await pool.query(
      "INSERT INTO service_types (service_name, description, created_at, updated_at) VALUES (?,?,NOW(),NOW())",
      [data.service_name, data.description]
    );
    return r.insertId;
  }
};