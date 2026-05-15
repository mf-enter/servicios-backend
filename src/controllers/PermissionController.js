import { Permission } from "../models/Permission.js";

export const getPermissions = async (req, res, next) => {
  try { res.json({ status: true, data: await Permission.findAll() }); }
  catch (err) { next(err); }
};

export const createPermission = async (req, res, next) => {
  try { res.json({ status: true, id: await Permission.create(req.body) }); }
  catch (err) { next(err); }
};