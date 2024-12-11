import jwt from "jsonwebtoken";

const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY;
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || "RS256";
const JWT_ROLE_CLAIM = process.env.JWT_ROLE_CLAIM || "role";

if (!JWT_PUBLIC_KEY) {
  throw new Error("JWT_PUBLIC_KEY not defined in .env file");
}

export const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }

  const token = authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_PUBLIC_KEY, {
      algorithms: [JWT_ALGORITHM],
    });

    // Add decoded user info to request
    req.user = decoded;
    req.userRole = decoded[JWT_ROLE_CLAIM];

    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};
