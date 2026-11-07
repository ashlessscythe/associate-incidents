import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export const validateToken = async (req, res, next) => {
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

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    // SECURITY: Re-check the account on every request so deactivated users and
    // role/admin changes take effect immediately rather than when the JWT expires.
    const dbUser = await prisma.user.findFirst({
      where: { id: decoded.userId },
      select: {
        isActive: true,
        isAdmin: true,
        roles: { select: { role: { select: { name: true } } } },
      },
    });

    if (!dbUser || !dbUser.isActive) {
      return res.status(401).json({ error: "Account is inactive or no longer exists" });
    }

    req.user = {
      ...decoded,
      isAdmin: dbUser.isAdmin,
      roles: dbUser.roles
        .map((ur) => ur.role.name)
        .filter((name) => name !== "admin"),
    };

    next();
  } catch (error) {
    console.error("Token user lookup failed:", error.message);
    return res.status(500).json({ error: "Failed to validate session" });
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

/** Allow admins, or users holding at least one of the given roles. */
export const requireAnyRole = (...allowed) => (req, res, next) => {
  if (req.user?.isAdmin) return next();
  const roles = req.user?.roles;
  if (Array.isArray(roles) && allowed.some((r) => roles.includes(r))) {
    return next();
  }
  return res.status(403).json({ error: "Insufficient permissions" });
};
