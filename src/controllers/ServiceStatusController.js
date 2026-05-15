import { ServiceStatus } from "../models/ServiceStatus.js";

export const getServiceStatuses = async (req, res, next) => {
  try { res.json({ status: true, data: await ServiceStatus.findAll() }); }
  catch (err) { next(err); }
};

export const createServiceStatus = async (req, res, next) => {
  try { res.json({ status: true, id: await ServiceStatus.create(req.body) }); }
  catch (err) { next(err); }
};