import { WorkerProfile } from "../models/WorkerProfile.js";
import { Worker } from "../models/Worker.js";
import bcrypt from "bcryptjs";
// src/controllers/WorkerController.js
import { Service } from "../models/Service.js";

const normalizeStatus = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "");

const ACTIVE_STATUSES = new Set(["pendiente", "aceptado", "enprogreso"]);
const HISTORY_STATUSES = new Set(["completado", "cancelado"]);
export const getWorkers = async (req, res, next) => {
  try {
    const workers = await Worker.findAll();
    res.json({ status: true, data: workers });
  } catch (err) {
    next(err);
  }
};


export const getMyWorkerHistory = async (req, res, next) => {
  try {
    const workerId = req.user.worker_id ?? req.user.user_id;
    const all = await Service.findByWorker(workerId);
    const data = all.filter((service) => HISTORY_STATUSES.has(normalizeStatus(service.status_name)));
    res.json({ status: true, data });
  } catch (err) { next(err); }
};

export const getMyWorkerServices = async (req, res, next) => {
  try {
    const workerId = req.user.worker_id ?? req.user.user_id;
    const all = await Service.findByWorker(workerId);
    const data = all.filter((service) => ACTIVE_STATUSES.has(normalizeStatus(service.status_name)));
    res.json({ status: true, data });
  } catch (err) {
    next(err);
  }
};

export const getWorker = async (req, res, next) => {
  try {
    const id = req.params.id;
    const worker = await Worker.findById(id);
    if (!worker) return res.status(404).json({ status: false, message: "Worker not found" });
    res.json({ status: true, data: worker });
  } catch (err) {
    next(err);
  }
};

export const createWorker = async (req, res, next) => {
  try {
    const data = req.body;
    if (!data.name || !data.lastname || !data.email || !data.password) {
      return res.status(400).json({ status: false, message: "Datos incompletos" });
    }
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    data.is_verified = false;
    const id = await Worker.create(data);
    res.status(201).json({ status: true, id });
  } catch (err) {
    next(err);
  }
};

export const updateWorker = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = req.body;
    await Worker.update(id, data);
    res.json({ status: true });
  } catch (err) {
    next(err);
  }
};

export const deleteWorker = async (req, res, next) => {
  try {
    const id = req.params.id;
    await Worker.remove(id);
    res.json({ status: true });
  } catch (err) {
    next(err);
  }
};

export const verifyWorker = async (req, res, next) => {
  try {
    const id = req.params.id;
    const worker = await Worker.findById(id);
    if (!worker) return res.status(404).json({ status: false, message: "Worker not found" });
    await Worker.verify(id);
    res.json({ status: true, message: "Worker verificado" });
  } catch (err) {
    next(err);
  }
};