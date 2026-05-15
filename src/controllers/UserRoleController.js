import { UserRole } from "../models/UserRole.js";

export const getUserRoles = async (req, res, next) => {
  try { res.json({ status: true, data: await UserRole.findAll() }); }
  catch (err) { next(err); }
};

export const createUserRole = async (req, res, next) => {
  try { res.json({ status: true, id: await UserRole.create(req.body) }); }
  catch (err) { next(err); }
};