import { PrismaClient } from "@prisma/client";
import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { rules, occurrenceTypes, notificationLevels } from "./definitions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const associatesFileName = "associates.csv";

// db
const prisma = new PrismaClient();
// clear if requested
const clearFlag = process.argv.includes("--clear");

async function clearData() {
  await prisma.attendanceOccurrence.deleteMany();
  await prisma.correctiveAction.deleteMany();
  await prisma.associate.deleteMany();
  await prisma.notificationLevel.deleteMany();
  console.log("All associates and related data cleared.");
}

async function upsertOccurrenceTypes() {
  for (const type of occurrenceTypes) {
    await prisma.occurrenceType.upsert({
      where: { code: type.code },
      update: type,
      create: type,
    });
  }
  console.log("OccurrenceTypes upserted successfully.");
}

async function upsertNotificationLevels() {
  for (const level of notificationLevels) {
    await prisma.notificationLevel.upsert({
      where: {
        designation_level: {
          designation: level.designation,
          level: level.level,
        },
      },
      update: {
        name: level.name,
        pointThreshold: level.pointThreshold,
      },
      create: {
        designation: level.designation,
        level: level.level,
        name: level.name,
        pointThreshold: level.pointThreshold,
      },
    });
  }
  console.log("NotificationLevels upserted successfully.");
}

async function upsertRules() {
  for (const rule of rules) {
    await prisma.rule.upsert({
      where: { code: rule.code },
      update: rule,
      create: rule,
    });
  }
  console.log("Rules upserted successfully.");
}

async function readAssociatesFromCSV(filePath) {
  const associates = [];
  if (!fs.existsSync(filePath)) {
    console.error(`${filePath} not found. Skipping associate creation.`);
    return associates;
  }

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        associates.push({
          name: row.name,
          currentPoints: 0,
          ssoid: row.ssoid || null,
          designation: row.designation || "NONE",
        });
      })
      .on("end", () => resolve(associates))
      .on("error", reject);
  });
}

async function upsertAssociates(associates) {
  for (const associate of associates) {
    await prisma.associate.upsert({
      where: {
        name: associate.name, // Find associate by unique name
      },
      update: {
        // Only update fields that are provided and not null
        ssoid: associate.ssoid || undefined, // Update ssoid only if provided
        designation: associate.designation || undefined, // Update designation only if provided
      },
      create: {
        name: associate.name,
        currentPoints: associate.currentPoints || 0, // Default to 0 if not provided
        ssoid: associate.ssoid || null, // Create with ssoid if provided, else null
        designation: associate.designation || "NONE", // Default to "NONE"
      },
    });
  }
  console.log(`${associates.length} associates created from CSV.`);
}

async function main() {
  try {
    // Check for flags from command line
    const clearFlag = process.argv.includes("--clear");
    const occurrencesOnly = process.argv.includes("--occurrences-only");
    const rulesOnly = process.argv.includes("--rules-only");
    const usersOnly = process.argv.includes("--users-only");
    const notificationsOnly = process.argv.includes("--notifications-only");

    if (clearFlag) {
      await clearData();
    }

    // Handle notifications only mode
    if (notificationsOnly || (!occurrencesOnly && !rulesOnly && !usersOnly)) {
      await upsertNotificationLevels();
      if (notificationsOnly) {
        console.log("Notifications only mode. Skipping other operations.");
        return;
      }
    }

    // Handle occurrences only mode
    if (occurrencesOnly || (!rulesOnly && !usersOnly && !notificationsOnly)) {
      await upsertOccurrenceTypes();
      if (occurrencesOnly) {
        console.log("Occurrences only mode. Skipping other operations.");
        return;
      }
    }

    // Handle rules only mode
    if (rulesOnly || (!occurrencesOnly && !usersOnly && !notificationsOnly)) {
      await upsertRules();
      if (rulesOnly) {
        console.log("Rules only mode. Skipping other operations.");
        return;
      }
    }

    // Handle users only mode
    if (usersOnly || (!occurrencesOnly && !rulesOnly && !notificationsOnly)) {
      const csvPath = path.join(__dirname, associatesFileName);
      const associates = await readAssociatesFromCSV(csvPath);
      if (associates.length > 0) {
        await upsertAssociates(associates);
        console.log("Associates upserted successfully.");
      } else {
        console.log("No associates found in CSV.");
      }
      if (usersOnly) {
        return;
      }
    }

    console.log("Seed completed successfully.");
  } catch (err) {
    console.error("Error in seed script:", err);
  } finally {
    await prisma.$disconnect();
  }
}

// ye
main();
