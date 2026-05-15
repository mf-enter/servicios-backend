import { pool } from "../config/db.js";

export const Country = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM countries");
    return rows;
  },
  create: async (data) => {
    const [r] = await pool.query(
      "INSERT INTO countries (country_name, code, created_at, updated_at) VALUES (?,?,NOW(),NOW())",
      [data.country_name, data.code]
    );
    return r.insertId;
  }
};