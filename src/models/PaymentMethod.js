import { pool } from "../config/db.js";

export const PaymentMethod = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM payment_methods");
    return rows;
  },
  create: async (data) => {
    const [r] = await pool.query(
      "INSERT INTO payment_methods (name, created_at, updated_at) VALUES (?,NOW(),NOW())",
      [data.name]
    );
    return r.insertId;
  }
};