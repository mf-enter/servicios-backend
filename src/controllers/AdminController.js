import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";
import { Admin } from "../models/Admin.js";

export const getAdminDashboard = async (req, res, next) => {
  try {
    const [services] = await pool.query("SELECT COUNT(*) total FROM services");
    const [pending] = await pool.query("SELECT COUNT(*) total FROM services WHERE status_id=1");
    const [workers] = await pool.query("SELECT COUNT(*) total FROM workers");

    const [byWorker] = await pool.query(`
      SELECT w.worker_id, w.name, COUNT(s.service_id) AS total_services
      FROM workers w
      LEFT JOIN services s ON s.worker_id = w.worker_id
      GROUP BY w.worker_id
    `);

    res.json({
      status: true,
      data: {
        total_services: services[0].total,
        pending_services: pending[0].total,
        total_workers: workers[0].total,
        services_by_worker: byWorker
      }
    });
  } catch (err) { next(err); }
};

export const getAdminServices = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, st.status_name,
        c.name AS client_name, w.name AS worker_name,
        pm.status AS payment_status
      FROM services s
      LEFT JOIN users c ON s.client_id = c.user_id
      LEFT JOIN workers w ON s.worker_id = w.worker_id
      LEFT JOIN service_statuses st ON s.status_id = st.status_id
      LEFT JOIN payments pm ON pm.service_id = s.service_id
      ORDER BY s.service_id DESC
    `);
    res.json({ status: true, data: rows });
  } catch (err) { next(err); }
};

export const getWorkerAgenda = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT w.worker_id, w.name, w.email,
        s.service_id, s.status_id, st.status_name,
        c.name AS client_name,
        NULL AS client_phone,
        pm.amount AS estimated_price,
        s.request_date, s.scheduled_date, s.started_at, s.finished_at,
        pm.status AS payment_status
      FROM workers w
      LEFT JOIN services s ON s.worker_id = w.worker_id
      LEFT JOIN users c ON s.client_id = c.user_id
      LEFT JOIN service_statuses st ON s.status_id = st.status_id
      LEFT JOIN payments pm ON pm.service_id = s.service_id
      ORDER BY w.worker_id, s.service_id DESC
    `);
    res.json({ status: true, data: rows });
  } catch (err) { next(err); }
};

export const listAdmins = async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT admin_id, name, lastname, email, is_active, created_at FROM admins ORDER BY admin_id DESC");
    res.json({ status: true, data: rows });
  } catch (err) { next(err); }
};

export const getAdminById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ status: false, message: "Admin not found" });
    res.json({ status: true, data: admin });
  } catch (err) { next(err); }
};

export const createAdmin = async (req, res, next) => {
  try {
    const { name, lastname, email, password } = req.body;
    if (!password) return res.status(400).json({ status: false, message: "password required" });
    const hash = await bcrypt.hash(password, 10);
    const id = await Admin.create({ name, lastname, email, password: hash });
    res.status(201).json({ status: true, id });
  } catch (err) { next(err); }
};

export const updateAdmin = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = req.body;
    await pool.query("UPDATE admins SET name=?, lastname=?, email=?, is_active=?, updated_at=NOW() WHERE admin_id=?", [data.name, data.lastname, data.email, data.is_active ? 1 : 0, id]);
    res.json({ status: true });
  } catch (err) { next(err); }
};

export const deleteAdmin = async (req, res, next) => {
  try {
    const id = req.params.id;
    await pool.query("DELETE FROM admins WHERE admin_id=?", [id]);
    res.json({ status: true });
  } catch (err) { next(err); }
};