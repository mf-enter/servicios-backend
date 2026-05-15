import { Permission } from "../models/Permission.js";

export const checkPermission = (permName) => {
  return async (req, res, next) => {
    try {
      const ok = await Permission.userHasPermission(req.user.user_id, permName);
      if (!ok) return res.status(403).json({ status: false, message: "Permiso denegado" });
      next();
    } catch (err) {
      next(err);
    }
  };
};