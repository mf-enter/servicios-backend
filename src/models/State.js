import { pool } from "../config/db.js";

export const State = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM states");
    return rows;
  },
  create: async (data) => {
    const [r] = await pool.query(
      "INSERT INTO states (country_id, state_name, created_at, updated_at) VALUES (?,?,NOW(),NOW())",
      [data.country_id, data.state_name]
    );
    return r.insertId;
  }
};