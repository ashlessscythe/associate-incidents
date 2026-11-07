// Comma-separated allowlist in CORS_ORIGIN. Falls back to the Vite dev origin; the
// built app is served same-origin by Express and needs no CORS.
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const corsOptions = {
  origin: (origin, cb) => {
    // No Origin header: same-origin or non-browser client.
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
