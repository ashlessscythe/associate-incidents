import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Configure CORS
const corsOptions = {
  origin: true, // This allows all origins. In production, you might want to be more specific.
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "dist")));

// Get all associates
app.get("/api/associates", async (req, res) => {
  try {
    const associates = await prisma.associate.findMany();
    res.json(associates);
  } catch (error) {
    res.status(500).json({ error: "Error fetching associates" });
  }
});

// Get all occurrence types
app.get("/api/occurrence-types", async (req, res) => {
  try {
    const occurrenceTypes = await prisma.occurrenceType.findMany();
    res.json(occurrenceTypes);
  } catch (error) {
    res.status(500).json({ error: "Error fetching occurrence types" });
  }
});

// Get attendance occurrences for a specific associate
app.get("/api/attendance-occurrences/:associateId", async (req, res) => {
  try {
    const { associateId } = req.params;
    const occurrences = await prisma.attendanceOccurrence.findMany({
      where: { associateId },
      include: { type: true },
      orderBy: { date: "desc" },
    });
    res.json(occurrences);
  } catch (error) {
    res.status(500).json({ error: "Error fetching attendance occurrences" });
  }
});

// Add a new attendance occurrence
app.post("/api/attendance-occurrences", async (req, res) => {
  try {
    const { associateId, typeId, date } = req.body;
    const occurrenceType = await prisma.occurrenceType.findUnique({
      where: { id: typeId },
    });
    console.log("occurrenceType:", occurrenceType);
    const newOccurrence = await prisma.attendanceOccurrence.create({
      data: {
        associateId,
        typeId,
        date: new Date(date),
        pointsAtTime: occurrenceType.points,
      },
      include: { type: true },
    });

    res.json(newOccurrence);
  } catch (error) {
    res.status(500).json({ error: "Error adding attendance occurrence" });
  }
});

// New route for getting associate points and notification
app.get("/api/associates/:id/points-and-notification", async (req, res) => {
  try {
    const { id } = req.params;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const relevantOccurrences = await prisma.attendanceOccurrence.findMany({
      where: {
        associateId: id,
        date: {
          gte: oneYearAgo,
        },
      },
      include: {
        type: true,
      },
    });

    const totalPoints = relevantOccurrences.reduce(
      (sum, occ) => sum + occ.type.points,
      0
    );

    let notificationLevel = "None";
    if (totalPoints >= 10) notificationLevel = "Termination";
    else if (totalPoints >= 9) notificationLevel = "Final Written";
    else if (totalPoints >= 8) notificationLevel = "2nd Written";
    else if (totalPoints >= 6) notificationLevel = "1st Written";
    else if (totalPoints >= 4) notificationLevel = "Verbal";

    res.json({ points: totalPoints, notificationLevel });
  } catch (error) {
    console.error("Error calculating points:", error);
    res
      .status(500)
      .json({ error: "Error calculating points and notification level" });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
