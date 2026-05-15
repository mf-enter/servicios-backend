import { Address } from "../models/Address.js";

export const getAddresses = async (req, res, next) => {
  try { res.json({ status: true, data: await Address.findAll() }); }
  catch (err) { next(err); }
};

export const createAddress = async (req, res, next) => {
  try { res.json({ status: true, id: await Address.create(req.body) }); }
  catch (err) { next(err); }
};