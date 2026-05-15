import { ServiceHistory } from "../models/ServiceHistory.js";

export const getServiceHistory = async (req, res, next) => {
  try { res.json({ status: true, data: await ServiceHistory.findAll() }); }
  catch (err) { next(err); }
};

export const createServiceHistory = async (req, res, next) => {
  try { res.json({ status: true, id: await ServiceHistory.create(req.body) }); }
  catch (err) { next(err); }
};