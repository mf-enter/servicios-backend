import { pool } from "../config/db.js";

export const City = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM cities");
    return rows;
  },
  create: async (data) => {
    const [r] = await pool.query(
      "INSERT INTO cities (state_id, city_name, created_at, updated_at) VALUES (?,?,NOW(),NOW())",
      [data.state_id, data.city_name]
    );
    return r.insertId;
  }
};