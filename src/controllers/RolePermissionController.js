import { RolePermission } from "../models/RolePermission.js";

export const getRolePermissions = async (req, res, next) => {
  try { res.json({ status: true, data: await RolePermission.findAll() }); }
  catch (err) { next(err); }
};

export const createRolePermission = async (req, res, next) => {
  try { res.json({ status: true, id: await RolePermission.create(req.body) }); }
  catch (err) { next(err); }
};