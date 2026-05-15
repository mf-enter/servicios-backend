import { pool } from "../config/db.js";

export const Review = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM service_reviews");
    return rows;
  },
  create: async (data) => {
    const [r] = await pool.query(
      "INSERT INTO service_reviews (service_id, reviewer_id, reviewed_id, rating, comment, created_at) VALUES (?,?,?,?,?,NOW())",
      [data.service_id, data.reviewer_id, data.reviewed_id, data.rating, data.comment]
    );
    return r.insertId;
  }
};