// Simple in-memory rate limiter for password reset endpoints
// SECURITY: Prevents brute force attacks on password reset

const resetAttempts = new Map();

export const passwordResetRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5; // Maximum 5 attempts per 15 minutes

  // Clean up old entries
  if (resetAttempts.has(ip)) {
    const attempts = resetAttempts.get(ip);
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length === 0) {
      resetAttempts.delete(ip);
    } else {
      resetAttempts.set(ip, recentAttempts);
    }
  }

  const attempts = resetAttempts.get(ip) || [];
  const recentAttempts = attempts.filter(time => now - time < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    return res.status(429).json({
      message: "Too many password reset attempts. Please try again later.",
    });
  }

  // Record this attempt
  recentAttempts.push(now);
  resetAttempts.set(ip, recentAttempts);

  next();
};

// Rate limiter for login attempts
const loginAttempts = new Map();

export const loginRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 10; // Maximum 10 login attempts per 15 minutes

  // Clean up old entries
  if (loginAttempts.has(ip)) {
    const attempts = loginAttempts.get(ip);
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length === 0) {
      loginAttempts.delete(ip);
    } else {
      loginAttempts.set(ip, recentAttempts);
    }
  }

  const attempts = loginAttempts.get(ip) || [];
  const recentAttempts = attempts.filter(time => now - time < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    return res.status(429).json({
      message: "Too many login attempts. Please try again later.",
    });
  }

  // Record this attempt (only on failure, but we'll record all for simplicity)
  recentAttempts.push(now);
  loginAttempts.set(ip, recentAttempts);

  next();
};

