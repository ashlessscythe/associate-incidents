import { PrismaClient } from "@prisma/client";
import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { rules, occurrenceTypes, notificationLevels } from "./definitions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const associatesFileName = "associates.csv";
const occurrencesFileName = "occurrences.csv";

const prisma = new PrismaClient();

async function clearData() {
  await prisma.attendanceOccurrence.deleteMany();
  await prisma.correctiveAction.deleteMany();
  await prisma.associate.deleteMany();
  await prisma.notificationLevel.deleteMany();
  await prisma.occurrenceType.deleteMany();
  console.log("All data cleared.");
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
        name: associate.name,
      },
      update: {
        ssoid: associate.ssoid || undefined,
        designation: associate.designation || undefined,
      },
      create: {
        name: associate.name,
        currentPoints: associate.currentPoints || 0,
        ssoid: associate.ssoid || null,
        designation: associate.designation || "NONE",
      },
    });
  }
  console.log(`${associates.length} associates upserted from CSV.`);
}

async function readOccurrencesFromCSV(filePath) {
  const occurrences = [];
  if (!fs.existsSync(filePath)) {
    console.error(`${filePath} not found. Skipping occurrence creation.`);
    return occurrences;
  }

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        occurrences.push({
          ssoid: row.SSO,
          name: row.name,
          date: new Date(row.date),
          code: row.code,
          comment: row.comment,
        });
      })
      .on("end", () => resolve(occurrences))
      .on("error", reject);
  });
}

async function upsertOccurrences(occurrences) {
  let batchSize = 100; // Adjust the batch size for performance tuning
  let upsertedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < occurrences.length; i += batchSize) {
    const batch = occurrences.slice(i, i + batchSize);

    for (const occurrence of batch) {
      try {
        const associate = await prisma.associate.findFirst({
          where: {
            OR: [{ ssoid: occurrence.ssoid }, { name: occurrence.name }],
          },
        });

        if (!associate) {
          console.error(
            `Associate not found for SSO: ${occurrence.ssoid} or Name: ${occurrence.name}. Skipping occurrence.`
          );
          skippedCount++;
          continue;
        }

        const occurrenceType = await prisma.occurrenceType.findFirst({
          where: { code: { equals: occurrence.code, mode: "insensitive" } },
        });

        if (!occurrenceType) {
          console.error(
            `OccurrenceType not found for code: ${occurrence.code}. Skipping occurrence.`
          );
          skippedCount++;
          continue;
        }

        // Check if the occurrence already exists
        const existingOccurrence = await prisma.attendanceOccurrence.findFirst({
          where: {
            associateId: associate.id,
            typeId: occurrenceType.id,
            date: occurrence.date,
          },
        });

        if (existingOccurrence) {
          // Update existing occurrence
          await prisma.attendanceOccurrence.update({
            where: { id: existingOccurrence.id },
            data: {
              notes: occurrence.comment,
              pointsAtTime: occurrenceType.points,
            },
          });
        } else {
          // Create new occurrence
          await prisma.attendanceOccurrence.create({
            data: {
              associateId: associate.id,
              typeId: occurrenceType.id,
              date: occurrence.date,
              notes: occurrence.comment,
              pointsAtTime: occurrenceType.points,
            },
          });
        }

        upsertedCount++;
      } catch (error) {
        console.error(
          `Error processing occurrence: ${error.message}. Skipping occurrence.`
        );
        skippedCount++;
      }
    }
  }

  console.log(`${upsertedCount} occurrences upserted from CSV.`);
  console.log(`${skippedCount} occurrences skipped due to errors.`);
}

async function main() {
  try {
    const clearFlag = process.argv.includes("--clear");
    const occurrencesOnly = process.argv.includes("--occurrences-only");
    const rulesOnly = process.argv.includes("--rules-only");
    const usersOnly = process.argv.includes("--users-only");
    const notificationsOnly = process.argv.includes("--notifications-only");

    if (clearFlag) {
      await clearData();
    }

    // Always upsert OccurrenceTypes first
    await upsertOccurrenceTypes();

    const operations = [];

    if (notificationsOnly) {
      operations.push(upsertNotificationLevels);
    }

    if (rulesOnly) {
      operations.push(upsertRules);
    }

    if (usersOnly) {
      operations.push(async () => {
        const csvPath = path.join(__dirname, associatesFileName);
        const associates = await readAssociatesFromCSV(csvPath);
        if (associates.length > 0) {
          await upsertAssociates(associates);
        } else {
          console.log("No associates found in CSV.");
        }
      });
    }

    if (occurrencesOnly) {
      operations.push(async () => {
        const occurrencesCsvPath = path.join(__dirname, occurrencesFileName);
        const occurrences = await readOccurrencesFromCSV(occurrencesCsvPath);
        if (occurrences.length > 0) {
          await upsertOccurrences(occurrences);
        } else {
          console.log("No occurrences found in CSV.");
        }
      });
    }

    // If no specific flag is set, perform all operations
    if (operations.length === 0) {
      operations.push(
        upsertNotificationLevels,
        upsertRules,
        async () => {
          const csvPath = path.join(__dirname, associatesFileName);
          const associates = await readAssociatesFromCSV(csvPath);
          if (associates.length > 0) {
            await upsertAssociates(associates);
          } else {
            console.log("No associates found in CSV.");
          }
        },
        async () => {
          const occurrencesCsvPath = path.join(__dirname, occurrencesFileName);
          const occurrences = await readOccurrencesFromCSV(occurrencesCsvPath);
          if (occurrences.length > 0) {
            await upsertOccurrences(occurrences);
          } else {
            console.log("No occurrences found in CSV.");
          }
        }
      );
    }

    for (const operation of operations) {
      await operation();
    }

    console.log("Seed completed successfully.");
  } catch (err) {
    console.error("Error in seed script:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
