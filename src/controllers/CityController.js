import { City } from "../models/City.js";

export const getCities = async (req, res, next) => {
  try { res.json({ status: true, data: await City.findAll() }); }
  catch (err) { next(err); }
};

export const createCity = async (req, res, next) => {
  try { res.json({ status: true, id: await City.create(req.body) }); }
  catch (err) { next(err); }
};