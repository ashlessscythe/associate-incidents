import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import { corsOptions } from "./config/corsConfig.js";
import { validateToken } from "./middleware/auth.js";
import authRoutes from "./routes/authRoutes.js";
import associateRoutes from "./routes/associateRoutes.js";
import occurrenceRoutes from "./routes/occurrenceRoutes.js";
import correctiveActionRoutes from "./routes/correctiveActionRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";
import utilRoutes from "./routes/utilRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import backupRoutes from "./routes/backupRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, "..", "dist")));

  // Auth routes (no token required)
  app.use("/zapi", authRoutes);

  // Apply the validateToken middleware to all other /zapi routes
  app.use("/zapi", validateToken);

  // Protected routes
  app.use("/zapi", associateRoutes);
  app.use("/zapi", occurrenceRoutes);
  app.use("/zapi", correctiveActionRoutes);
  app.use("/zapi", notificationRoutes);
  app.use("/zapi", exportRoutes);
  app.use("/zapi", utilRoutes);
  app.use("/zapi", fileRoutes);
  app.use("/zapi", backupRoutes);

  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
  });

  return app;
}

export default createApp;
