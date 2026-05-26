import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export const validateToken = (req, res, next) => {
  // SECURITY: Skip token validation for public auth endpoints
  // Check both with and without /zapi prefix since Express path handling varies
  const publicPaths = [
    '/auth/register',
    '/auth/login',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/zapi/auth/register',
    '/zapi/auth/login',
    '/zapi/auth/forgot-password',
    '/zapi/auth/reset-password'
  ];
  
  const isPublicPath = publicPaths.some(path => req.path.startsWith(path) || req.originalUrl.startsWith(path));
  if (isPublicPath) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }

  const token = authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // SECURITY: Verify user is active (additional check beyond token validation)
    // Note: This requires a DB lookup, so we'll rely on individual route checks
    // But we can add a flag check here if needed

    // Add decoded user info to request
    req.user = decoded;

    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

export const requireEditor = (req, res, next) => {
  const roles = req.user?.roles;
  if (!Array.isArray(roles) || !roles.includes("user-edit")) {
    return res.status(403).json({ error: "Editor access required" });
  }
  next();
};
