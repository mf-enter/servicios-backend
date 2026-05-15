import { pool } from "../config/db.js";

export const Document = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM documents");
    return rows;
  },
  create: async (data) => {
    const [r] = await pool.query(
      "INSERT INTO documents (user_id, name, doc_link, created_at, updated_at) VALUES (?,?,?,NOW(),NOW())",
      [data.user_id, data.name, data.doc_link]
    );
    return r.insertId;
  }
};