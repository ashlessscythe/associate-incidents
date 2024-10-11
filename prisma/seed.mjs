import { PrismaClient } from "@prisma/client";
import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  locations,
  departments,
  rules,
  occurrenceTypes,
  notificationLevels,
} from "./definitions.js";
import { faker } from "@faker-js/faker";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const associatesFileName = "associates.csv";
const occurrencesFileName = "occurrences.csv";

const prisma = new PrismaClient();

async function clearData() {
  await prisma.notification.deleteMany(); // clear notifications, mmmmm
  await prisma.exportRecord.deleteMany(); // clear export records, bruh
  await prisma.location.deleteMany(); // clear locs
  await prisma.department.deleteMany(); // bruh
  await prisma.rule.deleteMany(); // again
  await prisma.attendanceOccurrence.deleteMany();
  await prisma.correctiveAction.deleteMany();
  await prisma.associate.deleteMany();
  await prisma.notificationLevel.deleteMany();
  await prisma.occurrenceType.deleteMany();
  console.log("All data cleared.");
}

async function upsertLocations() {
  for (const location of locations) {
    await prisma.location.upsert({
      where: { name: location },
      update: {},
      create: { name: location },
    });
  }
  console.log("Locations upserted successfully.");
}

async function upsertDepartments() {
  for (const department of departments) {
    await prisma.department.upsert({
      where: { name: department },
      update: {},
      create: { name: department },
    });
  }
  console.log("Departments upserted successfully.");
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

function generateFakeAssociates(count) {
  const associates = [];
  const designations = ["MH", "NONE", "BRUH", "CLERK"];

  for (let i = 0; i < count; i++) {
    associates.push({
      name: faker.person.fullName(),
      currentPoints: 0,
      ssoid: faker.string.alphanumeric(8),
      designation: faker.helpers.arrayElement(designations),
      locationName: faker.datatype.boolean()
        ? faker.helpers.arrayElement(locations)
        : null,
      departmentName: faker.datatype.boolean()
        ? faker.helpers.arrayElement(departments)
        : null,
    });
  }

  return associates;
}

async function upsertAssociates(associates) {
  for (const associate of associates) {
    let locationId = null;
    let departmentId = null;

    if (associate.locationName) {
      const location = await prisma.location.findUnique({
        where: { name: associate.locationName },
      });
      locationId = location ? location.id : null;
    }

    if (associate.departmentName) {
      const department = await prisma.department.findUnique({
        where: { name: associate.departmentName },
      });
      departmentId = department ? department.id : null;
    }

    await prisma.associate.upsert({
      where: {
        name: associate.name,
      },
      update: {
        ssoid: associate.ssoid || undefined,
        designation: associate.designation || undefined,
        locationId: locationId,
        departmentId: departmentId,
      },
      create: {
        name: associate.name,
        currentPoints: associate.currentPoints || 0,
        ssoid: associate.ssoid || null,
        designation: associate.designation || "NONE",
        locationId: locationId,
        departmentId: departmentId,
      },
    });
  }
  console.log(`${associates.length} associates upserted.`);
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

function generateFakeOccurrences(associates, count) {
  const occurrences = [];
  const occurrenceCodes = occurrenceTypes.map((type) => type.code);

  for (let i = 0; i < count; i++) {
    const associate = faker.helpers.arrayElement(associates);
    occurrences.push({
      ssoid: associate.ssoid,
      name: associate.name,
      date: faker.date.past(),
      code: faker.helpers.arrayElement(occurrenceCodes),
      comment: faker.lorem.sentence(),
    });
  }

  return occurrences;
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

  console.log(`${upsertedCount} occurrences upserted.`);
  console.log(`${skippedCount} occurrences skipped due to errors.`);
}

// Function to generate fake corrective actions
function generateFakeCorrectiveActions(associates, rules, count) {
  const correctiveActions = [];
  const levels = [1, 2, 3, 4];

  for (let i = 0; i < count; i++) {
    const associate = faker.helpers.arrayElement(associates);
    const rule = faker.helpers.arrayElement(rules);

    if (associate && associate.id && rule && rule.id) {
      correctiveActions.push({
        associateId: associate.id,
        ruleId: rule.id,
        description: faker.lorem.sentence(),
        level: faker.helpers.arrayElement(levels),
        date: faker.date.past(),
      });
    }
  }

  return correctiveActions;
}

async function upsertCorrectiveActions(correctiveActions) {
  let upsertedCount = 0;
  let skippedCount = 0;

  for (const correctiveAction of correctiveActions) {
    try {
      if (!correctiveAction.associateId || !correctiveAction.ruleId) {
        console.error("Missing associateId or ruleId. Skipping.");
        skippedCount++;
        continue;
      }

      // Find an existing correctiveAction
      const existingCorrectiveAction = await prisma.correctiveAction.findFirst({
        where: {
          associateId: correctiveAction.associateId,
          ruleId: correctiveAction.ruleId,
        },
      });

      if (existingCorrectiveAction) {
        // If it exists, update it
        await prisma.correctiveAction.update({
          where: { id: existingCorrectiveAction.id },
          data: {
            description: correctiveAction.description,
            level: correctiveAction.level,
            date: correctiveAction.date,
          },
        });
      } else {
        // If it doesn't exist, create a new one
        await prisma.correctiveAction.create({
          data: {
            associateId: correctiveAction.associateId,
            ruleId: correctiveAction.ruleId,
            description: correctiveAction.description,
            level: correctiveAction.level,
            date: correctiveAction.date,
          },
        });
      }

      upsertedCount++;
    } catch (error) {
      console.error(`Error processing corrective action: ${error.message}`);
      skippedCount++;
    }
  }

  console.log(`${upsertedCount} corrective actions upserted.`);
  console.log(`${skippedCount} corrective actions skipped due to errors.`);
}

async function main() {
  try {
    const clearFlag = process.argv.includes("--clear");
    const occurrencesOnly = process.argv.includes("--occurrences-only");
    const rulesOnly = process.argv.includes("--rules-only");
    const usersOnly = process.argv.includes("--users-only");
    const caOnly = process.argv.includes("--ca-only");
    const notificationsOnly = process.argv.includes("--notifications-only");
    const useFakerFlag = process.argv.findIndex((arg) => arg === "--use-faker");
    const fakerCount =
      useFakerFlag !== -1 ? parseInt(process.argv[useFakerFlag + 1], 10) : 0;

    if (clearFlag) {
      await clearData();
    }

    // Always upsert these unless a specific --only flag is used
    if (
      !occurrencesOnly &&
      !rulesOnly &&
      !usersOnly &&
      !caOnly &&
      !notificationsOnly
    ) {
      await upsertOccurrenceTypes();
      await upsertLocations();
      await upsertDepartments();
      await upsertNotificationLevels();
      await upsertRules();
    } else {
      if (occurrencesOnly) await upsertOccurrenceTypes();
      if (rulesOnly) await upsertRules();
      if (notificationsOnly) await upsertNotificationLevels();
    }

    let associates = [];
    if (
      usersOnly ||
      (!occurrencesOnly && !rulesOnly && !caOnly && !notificationsOnly)
    ) {
      if (fakerCount > 0) {
        associates = generateFakeAssociates(fakerCount);
      } else {
        const csvPath = path.join(__dirname, associatesFileName);
        associates = await readAssociatesFromCSV(csvPath);
      }
      if (associates.length > 0) {
        await upsertAssociates(associates);
      } else {
        console.log("No associates found or generated.");
      }
    }

    if (
      occurrencesOnly ||
      (!usersOnly && !rulesOnly && !caOnly && !notificationsOnly)
    ) {
      if (associates.length === 0) {
        associates = await prisma.associate.findMany();
      }
      let occurrences;
      if (fakerCount > 0) {
        occurrences = generateFakeOccurrences(associates, fakerCount * 5);
      } else {
        const occurrencesCsvPath = path.join(__dirname, occurrencesFileName);
        occurrences = await readOccurrencesFromCSV(occurrencesCsvPath);
      }
      if (occurrences.length > 0) {
        await upsertOccurrences(occurrences);
      } else {
        console.log("No occurrences found or generated.");
      }
    }

    if (
      caOnly ||
      (!usersOnly && !occurrencesOnly && !rulesOnly && !notificationsOnly)
    ) {
      if (associates.length === 0) {
        associates = await prisma.associate.findMany();
      }
      const rules = await prisma.rule.findMany();

      if (associates.length === 0 || rules.length === 0) {
        console.log(
          "No associates or rules found. Cannot generate corrective actions."
        );
      } else {
        let correctiveActions;
        if (fakerCount > 0) {
          correctiveActions = generateFakeCorrectiveActions(
            associates,
            rules,
            fakerCount * 5
          );
        } else {
          console.log(
            "No source for corrective actions data. Use --use-faker to generate them."
          );
          return;
        }
        if (correctiveActions.length > 0) {
          await upsertCorrectiveActions(correctiveActions);
        } else {
          console.log("No corrective actions generated.");
        }
      }
    }

    console.log("Seed completed successfully.");
  } catch (err) {
    console.error("Error in seed script:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
