import { ServiceMessage } from "../models/ServiceMessage.js";

export const getServiceMessages = async (req, res, next) => {
  try { res.json({ status: true, data: await ServiceMessage.findAll() }); }
  catch (err) { next(err); }
};

export const createServiceMessage = async (req, res, next) => {
  try { res.json({ status: true, id: await ServiceMessage.create(req.body) }); }
  catch (err) { next(err); }
};