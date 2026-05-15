import { pool } from "../config/db.js";

export const Payment = {
  findAll: async () => {
    const [rows] = await pool.query("SELECT * FROM payments ORDER BY payment_id DESC");
    return rows;
  },
  create: async (data) => {
    const [result] = await pool.query(
      `INSERT INTO payments (service_id, payment_method_id, amount, pay_date, status, transaction_reference, created_at, updated_at)
       VALUES (?,?,?,NOW(),?,?,NOW(),NOW())`,
      [data.service_id, data.payment_method_id, data.amount, data.status, data.transaction_reference]
    );
    return result.insertId;
  },
  findByServiceId: async (serviceId) => {
    const [rows] = await pool.query("SELECT * FROM payments WHERE service_id=? ORDER BY payment_id DESC", [serviceId]);
    return rows[0] || null;
  },
  findById: async (id) => {
    const [rows] = await pool.query("SELECT * FROM payments WHERE payment_id=? LIMIT 1", [id]);
    return rows[0] || null;
  },
  findByTransactionReference: async (transactionReference) => {
    const [rows] = await pool.query("SELECT * FROM payments WHERE transaction_reference=? LIMIT 1", [transactionReference]);
    return rows[0] || null;
  },
  update: async (id, data) => {
    await pool.query(
      "UPDATE payments SET service_id=?, payment_method_id=?, amount=?, status=?, transaction_reference=?, updated_at=NOW() WHERE payment_id=?",
      [data.service_id, data.payment_method_id, data.amount, data.status, data.transaction_reference, id]
    );
  },
  remove: async (id) => {
    await pool.query("DELETE FROM payments WHERE payment_id=?", [id]);
  }
};