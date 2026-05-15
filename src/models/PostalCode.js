import { pool } from "../config/db.js";

export const PostalCode = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM postal_codes");
    return rows;
  },
  create: async (data) => {
    const [r] = await pool.query(
      "INSERT INTO postal_codes (city_id, postal_code, settlement_name, created_at, updated_at) VALUES (?,?,?,NOW(),NOW())",
      [data.city_id, data.postal_code, data.settlement_name]
    );
    return r.insertId;
  }
};