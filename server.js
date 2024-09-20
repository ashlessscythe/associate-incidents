import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

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

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "dist")));

// hash
const hashSalt = process.env.VITE_HASH_SALT;

if (!hashSalt) {
  throw new Error("Hash salt not defined in .env file");
} else {
  console.log(`server.js: Hash salt is ${hashSalt.length} chars`);
}

function generateTimeHash() {
  const now = new Date();
  const dateString = now.toISOString().split("T")[0];
  const hour = now.getUTCHours().toString().padStart(2, "0");
  // removing minute (a bit too agressive)
  // const minute = now.getUTCMinutes().toString().padStart(2, "0");

  const timeString = `${dateString}${hour}`;

  // Create hash
  const hash = crypto.createHash("sha256");
  hash.update(timeString + hashSalt);

  // Return first 8 characters of the hash
  return hash.digest("hex").substring(0, 8);
}

function validateTimeHash(hash) {
  const now = new Date();
  const currentHash = generateTimeHash();

  // Check if the hash matches the current minute
  if (hash === currentHash) {
    return true;
  }

  // Check if the hash matches the previous minute
  now.setMinutes(now.getMinutes() - 1);
  const previousHash = generateTimeHash();

  return hash === previousHash;
}

const validateApiKey = (req, res, next) => {
  const urlParts = req.url.split("/");
  const fullApiKey = urlParts[1]; // The full API key should now be the second part of the URL

  const [apiKey, timeHash] = fullApiKey.split("-");

  // Updated validation regex for the API key part
  const validPattern = /^(?=.*[!$^*_])(?!.*[92])[A-Za-z0-8!$^*\-_.~]{15}$/;

  if (
    apiKey &&
    timeHash &&
    validPattern.test(apiKey) &&
    validateTimeHash(timeHash)
  ) {
    // Remove the API key from the URL so that your route handlers don't need to change
    req.url = "/" + urlParts.slice(2).join("/");
    next();
  } else {
    res.status(401).json({ error: "Invalid API key" });
  }
};

// Apply the validateApiKey middleware to all /api routes
app.use("/zapi", validateApiKey);

// Associate STUFFS

// Get all associates
app.get("/zapi/associates", async (req, res) => {
  try {
    const associates = await prisma.associate.findMany({
      orderBy: { name: "asc" },
    });
    res.json(associates);
  } catch (error) {
    res.status(500).json({ error: "Error fetching associates" });
  }
});

// get associate by id
app.get("/zapi/associates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const associate = await prisma.associate.findUnique({
      where: { id },
    });
    if (!associate) {
      return res.status(404).json({ error: "Associate not found" });
    }
    res.json(associate);
  } catch (error) {
    res.status(500).json({ error: "Error fetching associate" });
  }
});

// add associate
app.post("/zapi/associates", async (req, res) => {
  try {
    const { name, currentPoints } = req.body;
    const associate = await prisma.associate.create({
      data: { name, currentPoints },
    });
    res.status(201).json(associate);
  } catch (error) {
    res.status(400).json({ error: "Invalid request payload" });
  }
});

// Get all occurrence types
app.get("/zapi/occurrence-types", async (req, res) => {
  try {
    const occurrenceTypes = await prisma.occurrenceType.findMany({
      orderBy: {
        code: "asc", // Sort by 'code' in ascending order (or change to 'desc' for descending)
      },
    });
    res.json(occurrenceTypes);
  } catch (error) {
    res.status(500).json({ error: "Error fetching occurrence types" });
  }
});

// Get attendance occurrences for a specific associate
app.get("/zapi/attendance-occurrences/:associateId", async (req, res) => {
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
app.post("/zapi/attendance-occurrences", async (req, res) => {
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
app.put("/zapi/attendance-occurrences/:id", async (req, res) => {
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
    console.error("Error updating occurrence:", error);
    res.status(500).json({ error: "Failed to update occurrence" });
  }
});

// delete occurrence by id
app.delete("/zapi/attendance-occurrences/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.attendanceOccurrence.delete({ where: { id } });
    res.json({ message: "Attendance occurrence deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting attendance occurrence" });
  }
});

// New route for getting associate points and notification
app.get("/zapi/associates/:id/points-and-notification", async (req, res) => {
  try {
    const { id } = req.params;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const associate = await prisma.associate.findUnique({
      where: { id },
      include: {
        occurrences: {
          where: {
            date: {
              gte: oneYearAgo,
            },
          },
          include: {
            type: true,
          },
        },
      },
    });

    if (!associate) {
      return res.status(404).json({ error: "Associate not found" });
    }

    const totalPoints = associate.occurrences.reduce(
      (sum, occ) => sum + occ.type.points,
      0
    );

    const notificationLevels = await prisma.notificationLevel.findMany({
      where: {
        designation: associate.designation,
      },
      orderBy: {
        pointThreshold: "desc",
      },
    });

    let notificationLevel = "None";
    for (const level of notificationLevels) {
      if (totalPoints >= level.pointThreshold) {
        notificationLevel = level.name;
        break;
      }
    }

    res.json({
      id: associate.id,
      name: associate.name,
      points: totalPoints,
      notificationLevel: notificationLevel,
      designation: associate.designation,
    });
  } catch (error) {
    console.error("Error calculating points:", error);
    res
      .status(500)
      .json({ error: "Error calculating points and notification level" });
  }
});

// Get info for all associates
app.get("/zapi/all-with-occurrences", async (req, res) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Fetch associates with occurrences
    const associates = await prisma.associate.findMany({
      include: {
        occurrences: {
          where: {
            date: {
              gte: oneYearAgo, // Fetch occurrences from the last year
            },
          },
          include: {
            type: true, // Fetch the type of occurrence to access the points
          },
        },
      },
    });

    // Map over each associate and calculate points & notification levels
    const associatesWithInfo = await Promise.all(
      associates.map(async (associate) => {
        const totalPoints = associate.occurrences.reduce(
          (sum, occ) => sum + occ.type.points,
          0
        );

        // Fetch notification levels based on designation
        const notificationLevels = await prisma.notificationLevel.findMany({
          where: {
            designation: associate.designation,
          },
          orderBy: {
            pointThreshold: "desc",
          },
        });

        // Determine the notification level
        let notificationLevel = "None";
        for (const level of notificationLevels) {
          if (totalPoints >= level.pointThreshold) {
            notificationLevel = level.name;
            break;
          }
        }

        // Return the associate data along with their calculated info
        return {
          id: associate.id,
          name: associate.name,
          occurrences: associate.occurrences,
          info: {
            id: associate.id,
            name: associate.name,
            points: totalPoints,
            notificationLevel: notificationLevel,
            designation: associate.designation,
          },
        };
      })
    );

    res.json(associatesWithInfo); // Send back the JSON response
  } catch (error) {
    console.error("Error fetching associates with occurrences:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// CA stuffs
// Get all rules
app.get("/zapi/rules", async (req, res) => {
  try {
    const rules = await prisma.rule.findMany();
    res.json(rules);
  } catch (error) {
    console.error("Error fetching rules:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get corrective actions for an associate
app.get("/zapi/corrective-actions/:associateId", async (req, res) => {
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
app.post("/zapi/corrective-actions", async (req, res) => {
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

// update CA
app.put("/zapi/corrective-actions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ruleId, description, level, date } = req.body;

    if (!ruleId || !description || !level) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const updatedCorrectiveAction = await prisma.correctiveAction.update({
      where: { id },
      data: {
        ruleId,
        description,
        level,
        date,
      },
      include: { rule: true },
    });

    res.json(updatedCorrectiveAction);
  } catch (err) {
    console.error("Error updating corrective action:", err);
    res.status(500).json({ error: "Failed to update corrective action" });
  }
});

// delete CA
app.delete("/zapi/corrective-actions/:id", async (req, res) => {
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
app.get("/zapi/associates-data", async (req, res) => {
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
      orderBy: { name: "asc" },
    });

    const formattedData = associatesData.map((associate) => ({
      id: associate.id,
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
app.get("/zapi/ca-by-type", async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12; // Default to 12 months if not specified
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    const caByTypeData = await prisma.associate.findMany({
      select: {
        id: true,
        name: true,
        correctiveActions: {
          where: {
            date: {
              gte: cutoffDate,
            },
          },
          select: {
            id: true,
            ruleId: true,
            date: true,
            level: true,
            description: true,
            rule: {
              select: {
                id: true,
                type: true,
                code: true,
                description: true,
              },
            },
          },
        },
      },
    });
    res.json(caByTypeData);
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
