import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import crypto from "crypto";
import XlsxPopulate from "xlsx-populate";
import path from "path";
import fs from "fs/promises";
import os from "os";
import axios from "axios";

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

// uploadthing stuffs
import { UTApi } from "uploadthing/server";

const utapi = new UTApi({ token: process.env.UPLOADTHING_SECRET });

app.get("/zapi/get-template/:type", async (req, res) => {
  const { type } = req.params;
  const fileKey =
    type === "ca" ? process.env.CA_TEMPLATE_KEY : process.env.OCC_TEMPLATE_KEY;

  if (!fileKey) {
    return res.status(400).send("Invalid template type");
  }

  try {
    // Get a signed URL for the file
    const signedUrl = await utapi.getSignedUrl(fileKey);

    // Fetch the file content using the signed URL
    const response = await fetch(signedUrl);
    if (!response.ok) throw new Error("Failed to fetch file from UploadThing");

    const fileBuffer = await response.arrayBuffer();

    res.set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.set("Content-Disposition", `attachment; filename=${type}.xlsx`);
    res.send(Buffer.from(fileBuffer));
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).send("Error retrieving template file");
  }
});

// locations and departments
app.get("/zapi/locations", async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });
    res.json(locations);
  } catch (e) {
    console.error("Error fetching locations:", e);
    res.status(500).json({ error: "Error fetching locations" });
  }
});

app.get("/zapi/departments", async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });
    res.json(departments);
  } catch (e) {
    console.error("Error fetching departments:", e);
    res.status(500).json({ error: "Error fetching departments." });
  }
});

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

// modify associate
app.put("/zapi/associates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, departmentId, designation, locationId } = req.body;

    // Validate that the location exists
    const locationExists = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!locationExists) {
      return res.status(400).json({ error: "Invalid location ID" });
    }

    // Validate that the department exists
    const departmentExists = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!departmentExists) {
      return res.status(400).json({ error: "Invalid department ID" });
    }

    const updatedAssociate = await prisma.associate.update({
      where: { id },
      data: {
        name,
        departmentId,
        designation,
        locationId,
      },
      include: {
        department: true,
        location: true,
      },
    });

    res.json(updatedAssociate);
  } catch (error) {
    console.error("Error updating associate:", error);
    res.status(500).json({ error: "Error updating associate" });
  }
});

// delete associate
app.delete("/zapi/associates/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find the associate first
    const associate = await prisma.associate.findUnique({
      where: { id },
    });

    if (!associate) {
      return res.status(404).json({ error: "Associate not found" });
    }

    // Try to delete the associate
    await prisma.associate.delete({ where: { id } });

    // Send success with no content
    res.status(204).send();
  } catch (error) {
    // Check for Prisma constraint violation errors
    if (error.code === "P2003") {
      // Prisma error code for foreign key constraint failure
      res.status(400).json({
        error:
          "Cannot delete associate, as there is related data in other tables.",
      });
    } else {
      // Log the full error for debugging
      console.error("Error deleting associate:", error);

      // Send a generic error message
      res.status(500).json({ error: "Error deleting associate" });
    }
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

// Get all associates with designation
app.get("/zapi/associates-with-designation", async (req, res) => {
  try {
    // Fetch all associates
    const associates = await prisma.associate.findMany({
      select: {
        id: true,
        name: true,
        designation: true,
        department: true,
        location: true,
      },
    });

    // Map the result to return only the necessary fields
    const result = associates.map((associate) => ({
      id: associate.id,
      name: associate.name,
      designation: associate.designation, // This should directly return the enum value
      department: associate.department,
      location: associate.location,
    }));

    // Send the response
    res.json(result);
  } catch (error) {
    console.error("Error fetching associates with designation:", error);
    res
      .status(500)
      .json({ error: "Error fetching associates with designation" });
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

// get all associates all CA
app.get("/zapi/ca-by-type-with-info", async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    const caDataWithInfo = await prisma.associate.findMany({
      include: {
        correctiveActions: {
          where: {
            date: {
              gte: cutoffDate,
            },
          },
          include: {
            rule: true,
          },
        },
        occurrences: {
          where: {
            date: {
              gte: cutoffDate,
            },
          },
          include: {
            type: true,
          },
        },
      },
    });

    const formattedData = caDataWithInfo.map((associate) => ({
      id: associate.id,
      name: associate.name,
      correctiveActions: associate.correctiveActions,
      info: {
        id: associate.id,
        name: associate.name,
        points: associate.occurrences.reduce(
          (sum, occ) => sum + occ.type.points,
          0
        ),
        designation: associate.designation,
      },
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching CA by type data with associate info:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
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
      include: { rule: true }, // Include the rule information
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

// Function to download and save template
async function getTemplate(fileKey, type) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "excel-templates-"));
  const filePath = path.join(tempDir, `${type}.xlsx`);

  try {
    const base_url =
      process.env.BASE_UPLOAD_URL || "https://example.com/urlnotset";
    const response = await axios.get(`${base_url}${fileKey}`, {
      responseType: "arraybuffer",
    });

    await fs.writeFile(filePath, response.data);
    return filePath;
  } catch (error) {
    console.error(`Error downloading template for ${type}:`, error);
    throw error;
  }
}

app.post("/zapi/export-excel-occurrence", async (req, res) => {
  try {
    const {
      associateName,
      location,
      department,
      date,
      occurrences,
      notificationLevel,
    } = req.body;

    // Load the template
    const templatePath = await getTemplate(
      process.env.OCC_TEMPLATE_KEY,
      "occurrence"
    );
    const workbook = await XlsxPopulate.fromFileAsync(templatePath);
    const sheet = workbook.sheet(0);

    // Fill in the basic information
    sheet.cell("A7").value(associateName);
    sheet.cell("F7").value(location);
    sheet.cell("H7").value(department);
    sheet.cell("J7").value(date);

    // Fill in the occurrences
    // occurrences.slice(0, 4).forEach((occurrence, index) => {
    //   const row = 24 + index;
    //   sheet
    //     .cell(`B${row}`)
    //     .value(new Date(occurrence.date).toISOString().split("T")[0]);
    //   sheet.cell(`D${row}`).value(occurrence.type.code);
    //   sheet.cell(`G${row}`).value(occurrence.type.points);
    // });

    // Fill in the notification level based on the provided value
    switch (notificationLevel) {
      case "Termination":
        sheet.cell("E10").value("10");
        break;
      case "Final Written Notice":
        sheet.cell("B10").value("7");
        break;
      case "2nd Written Notice":
        sheet.cell("H9").value("5");
        break;
      case "1st Written Notice":
        sheet.cell("E9").value("3");
        break;
      case "Verbal Notice":
        sheet.cell("B9").value("4");
        break;
    }

    // calculate total points
    const totalPoints = occurrences.reduce(
      (sum, occ) => sum + occ.type.points,
      0
    );

    // blurb
    const blurb = `Associate ${associateName} has below occurrences. Total points: ${totalPoints} \n\n`;

    // Fill in the misconduct description
    const misconduct = occurrences
      .map((occ) => {
        // Format the date as a string (e.g., "2023-09-27")
        const formattedDate = new Date(occ.date).toISOString().split("T")[0];
        return `${formattedDate} ${occ.type.code} - ${occ.type.points} pts`;
      })
      .join(", "); // Join with line feed character

    // combine above
    const fullMisconductText = blurb + misconduct;

    // fill in cell
    sheet.cell("A14").value(fullMisconductText);

    // Generate blob
    const excelBuffer = await workbook.outputAsync();

    // Clean up: delete the temporary file
    await fs.unlink(templatePath);

    // Set the appropriate headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${associateName}_occurrences.xlsx`
    );

    // Send the Excel file
    res.send(Buffer.from(excelBuffer));
  } catch (error) {
    console.error("Error generating Excel file:", error);
    res.status(500).json({ error: "Error generating Excel file" });
  }
});

app.post("/zapi/export-excel-ca", async (req, res) => {
  try {
    const {
      associateName,
      location,
      department,
      date,
      correctiveAction,
      notificationLevel,
    } = req.body;

    if (!associateName || !correctiveAction) {
      throw new Error("Missing required fields");
    }

    const templatePath = await getTemplate(process.env.CA_TEMPLATE_KEY, "ca");
    const workbook = await XlsxPopulate.fromFileAsync(templatePath);
    const sheet = workbook.sheet(0);

    // Fill in the basic associate information
    sheet.cell("A7").value(associateName);
    sheet.cell("F7").value(location);
    sheet.cell("H7").value(department);
    sheet.cell("J7").value(date);

    // Define the levels and their corresponding cells
    const levels = [
      { text: "Coaching Conversation", cell: "B10" },
      { text: "1st Documented Verbal Warning", cell: "E10" },
      { text: "2nd Written Warning", cell: "H10" },
      { text: "3rd Final Written Warning", cell: "B11" },
      { text: "4th Termination", cell: "E11" },
    ];

    // Extract the level number from the notificationLevel string
    const currentLevel = parseInt(notificationLevel.split(" - ")[0]);

    // Fill in the notification level
    levels.forEach((level, index) => {
      const cellValue =
        index === currentLevel ? `(X) ${level.text}` : `( ) ${level.text}`;
      sheet.cell(level.cell).value(cellValue);
    });

    // Reason for CA A13 = Appendix A, A14 = Appendix B (not very scalable, need to update if using other rules and/or types)
    const r = correctiveAction.rule;

    function formatDescription(description) {
      if (description.length <= 90) {
        return description;
      } else {
        return `${description.slice(0, 90)}...`;
      }
    }

    if (r.code.includes("Appendix A")) {
      sheet
        .cell("B13")
        .value(`(X) ${r.code} // ${formatDescription(r.description)}`);
      sheet.cell("B14").value("( ) Appendix B");
    } else if (r.code.includes("Appendix B")) {
      sheet.cell("B13").value("( ) Appendix A");
      sheet
        .cell("B14")
        .value(`(X) ${r.code} // ${formatDescription(r.description)}`);
    } else {
      // If neither Appendix A nor B, leave both unchecked
      sheet.cell("B13").value("( ) Appendix A");
      sheet.cell("B14").value("( ) Appendix B");
    }

    // Fill in the corrective action description
    const formattedDate = new Date(correctiveAction.date)
      .toISOString()
      .split("T")[0];
    const description = `${formattedDate} (${correctiveAction.description})`;

    const cell = sheet.cell("A17");
    cell.value(description);
    cell.style("wrapText", true);
    cell.style("verticalAlignment", "top");

    // Generate Excel file buffer
    const excelBuffer = await workbook.outputAsync();

    // Clean up: delete the temporary file
    await fs.unlink(templatePath);

    // Set the appropriate headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${associateName}_corrective_action.xlsx`
    );

    // Send the Excel file
    res.send(Buffer.from(excelBuffer));
  } catch (error) {
    console.error("Error generating Corrective Action Excel file:", error);
    res
      .status(500)
      .json({ error: "Error generating Corrective Action Excel file" });
  }
});

// export recording
app.post("/zapi/record-occ-export", async (req, res) => {
  const { associateId, exportedBy, exportedAt, location, department } =
    req.body;

  try {
    const exportRecord = await prisma.exportRecord.create({
      data: {
        associateId,
        exportedBy,
        exportedAt,
        location,
        department,
      },
    });
    res.json(exportRecord);
  } catch (error) {
    console.error("Error recording occ export:", error);
    res.status(500).json({ error: "Failed to record occ export" });
  }
});

app.get("/zapi/export-occ-records/:associateId", async (req, res) => {
  const { associateId } = req.params;

  try {
    const exportRecords = await prisma.exportRecord.findMany({
      where: { associateId },
      orderBy: { exportedAt: "desc" },
    });
    res.json(exportRecords);
  } catch (error) {
    console.error("Error fetching export occ records:", error);
    res.status(500).json({ error: "Failed to fetch export occ records" });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
