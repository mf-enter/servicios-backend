import jwt from "jsonwebtoken";

export const authToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ status: false, message: "Token requerido" });

  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ status: false, message: "Token inválido" });
  }
};