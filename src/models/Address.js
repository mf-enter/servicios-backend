import { pool } from "../config/db.js";

export const Address = {
  findById: async (id) => {
    const [rows] = await pool.query("SELECT * FROM addresses WHERE address_id = ?", [id]);
    return rows[0] || null;
  },
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
  },
  update: async (id, data) => {
    await pool.query(
      `UPDATE addresses
       SET entity_type=?, address_type=?, postal_code_id=?, street_name=?, ext_number=?, int_number=?, phone_number=?, updated_at=NOW()
       WHERE address_id=?`,
      [data.entity_type, data.address_type, data.postal_code_id, data.street_name, data.ext_number, data.int_number, data.phone_number, id]
    );
  }
};