import { pool } from "../config/db.js";

export const Worker = {
  findAll: async () => {
    const [rows] = await pool.query(`SELECT * FROM workers ORDER BY worker_id DESC`);
    return rows;
  },
  findById: async (id) => {
    const [rows] = await pool.query("SELECT * FROM workers WHERE worker_id = ?", [id]);
    return rows[0];
  },
  findByEmail: async (email) => {
    const [rows] = await pool.query("SELECT * FROM workers WHERE email = ?", [email]);
    return rows[0];
  },
  create: async (data, db = pool) => {
    const [result] = await db.query(
      `INSERT INTO workers (name, lastname, email, password, bio, hourly_rate, experience_years, is_verified, is_active, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,1,NOW(),NOW())`,
      [data.name, data.lastname, data.email, data.password || null, data.bio || null, data.hourly_rate || null, data.experience_years || null, data.is_verified ? 1 : 0]
    );
    return result.insertId;
  },
  update: async (id, data) => {
    const current = await Worker.findById(id);
    if (!current) return;
    await pool.query(
      `UPDATE workers SET name=?, lastname=?, email=?, bio=?, hourly_rate=?, experience_years=?, is_verified=?, updated_at=NOW() WHERE worker_id=?`,
      [
        data.name ?? current.name,
        data.lastname ?? current.lastname,
        data.email ?? current.email,
        data.bio ?? current.bio,
        data.hourly_rate ?? current.hourly_rate,
        data.experience_years ?? current.experience_years,
        data.is_verified ?? current.is_verified,
        id
      ]
    );
  },
  verify: async (id) => {
    await pool.query("UPDATE workers SET is_verified=1, updated_at=NOW() WHERE worker_id=?", [id]);
  },
  remove: async (id) => {
    await pool.query("DELETE FROM workers WHERE worker_id=?", [id]);
  }
};