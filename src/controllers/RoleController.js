import { Role } from "../models/Role.js";

export const getRoles = async (req, res, next) => {
  try { res.json({ status: true, data: await Role.findAll() }); }
  catch (err) { next(err); }
};

export const createRole = async (req, res, next) => {
  try { res.json({ status: true, id: await Role.create(req.body) }); }
  catch (err) { next(err); }
};