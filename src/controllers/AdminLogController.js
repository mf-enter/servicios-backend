import { AdminLog } from "../models/AdminLog.js";

export const getAdminLogs = async (req, res, next) => {
  try { res.json({ status: true, data: await AdminLog.findAll() }); }
  catch (err) { next(err); }
};

export const createAdminLog = async (req, res, next) => {
  try { await AdminLog.create(req.body); res.json({ status: true, message: "Log creado" }); }
  catch (err) { next(err); }
};