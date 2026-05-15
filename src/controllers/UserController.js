import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { User } from "../models/User.js";
import { WorkerProfile } from "../models/WorkerProfile.js";
import { Service } from "../models/Service.js";

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeStatus = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "");

const ACTIVE_STATUSES = new Set(["pendiente", "aceptado", "enprogreso"]);
const HISTORY_STATUSES = new Set(["completado", "cancelado"]);

export const getUsers = async (req, res, next) => {
  try {
    const data = await User.findAll();
    res.json({ status: true, data });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { name, lastname, email, password, user_type_id } = req.body;

    if (typeof name !== "string" || !name.trim()) throw createHttpError(400, "name es obligatorio");
    if (typeof lastname !== "string" || !lastname.trim()) throw createHttpError(400, "lastname es obligatorio");
    if (typeof email !== "string" || !email.trim()) throw createHttpError(400, "email es obligatorio");
    if (typeof password !== "string" || !password.trim()) throw createHttpError(400, "password es obligatorio");

    const parsedUserTypeId = Number(user_type_id);
    if (!Number.isInteger(parsedUserTypeId) || parsedUserTypeId <= 0) {
      throw createHttpError(400, "user_type_id debe ser un número válido");
    }

    const hash = await bcrypt.hash(password, 10);
    await connection.beginTransaction();

    const id = await User.create(
      { name: name.trim(), lastname: lastname.trim(), email: email.trim(), password: hash, user_type_id: parsedUserTypeId },
      connection
    );

    if (parsedUserTypeId === 3) {
      await WorkerProfile.create(id, connection);
    }

    await connection.commit();
    res.json({ status: true, message: "Usuario creado", id });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

export const updateUser = async (req, res, next) => {
  try {
    await User.update(req.params.id, req.body);
    res.json({ status: true, message: "Usuario actualizado" });
  } catch (err) { next(err); }
};

export const deleteUser = async (req, res, next) => {
  try {
    await User.remove(req.params.id);
    res.json({ status: true, message: "Usuario eliminado" });
  } catch (err) { next(err); }
};

export const getUserHistory = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const all = await Service.findByClient(userId);
    const data = all.filter((service) => HISTORY_STATUSES.has(normalizeStatus(service.status_name)));
    res.json({ status: true, data });
  } catch (err) { next(err); }
};

export const getMyUserServices = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const all = await Service.findByClient(userId);
    const data = all.filter((service) => ACTIVE_STATUSES.has(normalizeStatus(service.status_name)));
    res.json({ status: true, data });
  } catch (err) { next(err); }
};