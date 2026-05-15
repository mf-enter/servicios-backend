import { Country } from "../models/Country.js";

export const getCountries = async (req, res, next) => {
  try { res.json({ status: true, data: await Country.findAll() }); }
  catch (err) { next(err); }
};

export const createCountry = async (req, res, next) => {
  try { res.json({ status: true, id: await Country.create(req.body) }); }
  catch (err) { next(err); }
};