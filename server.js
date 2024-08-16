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

// Associate STUFFS

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
    const { associateId, typeId, date, notes } = req.body;
    const occurrenceType = await prisma.occurrenceType.findUnique({
      where: { id: typeId },
    });
    const newOccurrence = await prisma.attendanceOccurrence.create({
      data: {
        associateId,
        typeId,
        date: new Date(date),
        notes,
        pointsAtTime: occurrenceType.points,
      },
      include: { type: true },
    });

    // console.log("new occurrence", newOccurrence);

    res.json(newOccurrence);
  } catch (error) {
    res.status(500).json({ error: "Error adding attendance occurrence" });
  }
});

// edit
app.put('/api/attendance-occurrences/:id', async (req, res) => {
  const { id } = req.params;
  const { typeId, date, notes } = req.body;

  try {
    const updatedOccurrence = await prisma.attendanceOccurrence.update({
      where: { id },
      data: {
        typeId,
        date,
        notes,
      },
    });

    res.json(updatedOccurrence);
  } catch (error) {
    console.error('Error updating occurrence:', error);
    res.status(500).json({ error: 'Failed to update occurrence' });
  }
});

// delete occurrence by id
app.delete("/api/attendance-occurrences/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Deleting occurenceid: " + id);
    await prisma.attendanceOccurrence.delete({ where: { id } });
    res.json({ message: "Attendance occurrence deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting attendance occurrence" });
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

// CA stuffs
// Get all rules
app.get("/api/rules", async (req, res) => {
  try {
    const rules = await prisma.rule.findMany();
    res.json(rules);
  } catch (error) {
    console.error("Error fetching rules:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get corrective actions for an associate
app.get("/api/corrective-actions/:associateId", async (req, res) => {
  const { associateId } = req.params;
  try {
    // Validate associateId here if necessary
    const correctiveActions = await prisma.correctiveAction.findMany({
      where: { associateId: associateId },
      orderBy: { date: "desc" },
    });
    res.json(correctiveActions);
  } catch (error) {
    console.error("Error fetching corrective actions:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// Add a new corrective action
app.post("/api/corrective-actions", async (req, res) => {
  const { associateId, ruleId, description, level, date } = req.body;
  if (!associateId || !ruleId || !description || !level) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newCorrectiveAction = await prisma.correctiveAction.create({
      data: {
        associateId,
        ruleId,
        description,
        level,
        date,
      },
      include: { rule: true },
    });
    res.status(201).json(newCorrectiveAction);
  } catch (error) {
    console.error("Error creating corrective action:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// delete CA
app.delete("/api/corrective-actions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.correctiveAction.delete({
      where: { id },
    });
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting corrective action:", error);
    res.status(500).json({ error: "Failed to delete corrective action" });
  }
});

// associate stuffs
app.get("/api/associates-data", async (req, res) => {
  const months = parseInt(req.query.months) || 12; // Default to 12 months if not specified
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  try {
    const associatesData = await prisma.associate.findMany({
      select: {
        id: true,
        name: true,
        occurrences: {
          where: {
            date: {
              gte: cutoffDate,
            },
          },
          select: {
            type: {
              select: {
                points: true,
              },
            },
          },
        },
        correctiveActions: {
          select: {
            id: true,
          },
        },
      },
    });

    const formattedData = associatesData.map((associate) => ({
      name: associate.name,
      currentPoints: associate.occurrences.reduce(
        (sum, occurrence) => sum + occurrence.type.points,
        0
      ),
      totalOccurrences: associate.occurrences.length,
      totalCA: associate.correctiveActions.length,
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching associates data:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching associates data" });
  }
});

// get Corrective Action (CA) by type
app.get("/api/ca-by-type", async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12; // Default to 12 months if not specified
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    const caByTypeData = await prisma.associate.findMany({
      select: {
        name: true,
        correctiveActions: {
          where: {
            date: {
              gte: cutoffDate,
            },
          },
          select: {
            rule: {
              select: {
                type: true,
              },
            },
            date: true,
          },
        },
      },
    });

    const formattedData = caByTypeData.map((associate) => {
      const result = { name: associate.name };
      associate.correctiveActions.forEach((ca) => {
        const type = ca.rule.type;
        result[type] = (result[type] || 0) + 1;
      });
      return result;
    });

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching CA by type data:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching CA by type data" });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
