const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "change-this-to-a-strong-secret-key-in-production";

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Acceso denegado. Se requiere rol de administrador." });
  }
  next();
}

module.exports = { authMiddleware, adminMiddleware };
