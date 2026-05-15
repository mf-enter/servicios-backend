import { pool } from "../config/db.js";

export const ServiceMessage = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM service_messages");
    return rows;
  },
  create: async (data) => {
    const [r] = await pool.query(
      "INSERT INTO service_messages (service_id, sender_id, message, sent_at, is_read) VALUES (?,?,?,NOW(),0)",
      [data.service_id, data.sender_id, data.message]
    );
    return r.insertId;
  }
};