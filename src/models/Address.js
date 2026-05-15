import { pool } from "../config/db.js";

export const Address = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM addresses");
    return rows;
  },
  create: async (data) => {
    const [r] = await pool.query(
      `INSERT INTO addresses (entity_type, address_type, postal_code_id, street_name, ext_number, int_number, phone_number, is_active, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,1,NOW(),NOW())`,
      [data.entity_type, data.address_type, data.postal_code_id, data.street_name, data.ext_number, data.int_number, data.phone_number]
    );
    return r.insertId;
  }
};