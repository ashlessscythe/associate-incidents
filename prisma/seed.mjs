import { PrismaClient } from "@prisma/client";
import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { rules, occurrenceTypes } from "./definitions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// db
const prisma = new PrismaClient();
// clear if requested
const clearFlag = process.argv.includes("--clear");

async function clearData() {
  await prisma.attendanceOccurrence.deleteMany();
  await prisma.correctiveAction.deleteMany();
  await prisma.associate.deleteMany();
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
        });
      })
      .on("end", () => resolve(associates))
      .on("error", reject);
  });
}

async function createAssociates(associates) {
  for (const associate of associates) {
    await prisma.associate.create({
      data: associate,
    });
  }
  console.log(`${associates.length} associates created from CSV.`);
}

async function main() {
  try {
    if (clearFlag) {
      await clearData();
    }

    await upsertOccurrenceTypes();
    await upsertRules();

    const csvPath = path.join(__dirname, "associates.csv");
    const associates = await readAssociatesFromCSV(csvPath);
    if (associates.length > 0) {
      await createAssociates(associates);
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
