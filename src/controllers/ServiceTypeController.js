import { ServiceType } from "../models/ServiceType.js";

export const getServiceTypes = async (req, res, next) => {
  try { res.json({ status: true, data: await ServiceType.findAll() }); }
  catch (err) { next(err); }
};

export const createServiceType = async (req, res, next) => {
  try { res.json({ status: true, id: await ServiceType.create(req.body) }); }
  catch (err) { next(err); }
};