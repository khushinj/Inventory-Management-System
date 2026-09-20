import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-this-jwt-secret";

export function authenticateToken(req, res, next) {
  if (req.path === "/auth/login") {
    return next();
  }

  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

export { JWT_SECRET };