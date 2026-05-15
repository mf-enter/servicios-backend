import { State } from "../models/State.js";

export const getStates = async (req, res, next) => {
  try { res.json({ status: true, data: await State.findAll() }); }
  catch (err) { next(err); }
};

export const createState = async (req, res, next) => {
  try { res.json({ status: true, id: await State.create(req.body) }); }
  catch (err) { next(err); }
};