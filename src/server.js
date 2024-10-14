import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { corsOptions } from "./config/corsConfig.js";
import { validateApiKey } from "./middleware/auth.js";
import associateRoutes from "./routes/associateRoutes.js";
import occurrenceRoutes from "./routes/occurrenceRoutes.js";
import correctiveActionRoutes from "./routes/correctiveActionRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";
import utilRoutes from "./routes/utilRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
export const prisma = new PrismaClient();

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "..", "dist")));

// Apply the validateApiKey middleware to all /zapi routes
app.use("/zapi", validateApiKey);

// Routes
app.use("/zapi", associateRoutes);
app.use("/zapi", occurrenceRoutes);
app.use("/zapi", correctiveActionRoutes);
app.use("/zapi", notificationRoutes);
app.use("/zapi", exportRoutes);
app.use("/zapi", utilRoutes);
app.use("/zapi", fileRoutes);

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
