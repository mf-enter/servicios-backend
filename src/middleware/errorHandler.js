export const errorHandler = (err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Error interno";
  res.status(statusCode).json({ status: false, message });
};