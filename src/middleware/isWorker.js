export const isWorker = (req, res, next) => {
  if (req.user?.role !== "worker") {
    return res.status(403).json({ status: false, message: "Acceso denegado. Se requiere rol de trabajador" });
  }
  next();
};
