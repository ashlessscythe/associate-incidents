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
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const associatesFileName = "associates.csv";
const occurrencesFileName = "occurrences.csv";

const prisma = new PrismaClient();

async function clearFiles() {
  await prisma.file.deleteMany();
  console.log("Files deleted from db");
}

async function clearData() {
  // First clear files since they have foreign key relationships
  await clearFiles();

  await prisma.notification.deleteMany(); // clear notifications
  await prisma.exportRecord.deleteMany(); // clear export records
  await prisma.correctiveAction.deleteMany(); // clear corrective actions
  await prisma.attendanceOccurrence.deleteMany(); // clear occurrences
  await prisma.associate.deleteMany(); // clear associates
  await prisma.location.deleteMany(); // clear locations
  await prisma.department.deleteMany(); // clear departments
  await prisma.rule.deleteMany(); // clear rules
  await prisma.notificationLevel.deleteMany(); // clear notification levels
  await prisma.occurrenceType.deleteMany(); // clear occurrence types
  await prisma.designationVisibility.deleteMany(); // clear designation visibility
  await prisma.userRole.deleteMany(); // clear user roles (must be before users and roles)
  await prisma.user.deleteMany(); // clear users
  await prisma.role.deleteMany(); // clear roles

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

// Function to fetch existing associates from the database
async function fetchExistingAssociates(limit = null) {
  const query = {};
  if (limit) {
    query.take = limit;
  }

  const associates = await prisma.associate.findMany(query);
  console.log(`Fetched ${associates.length} existing associates.`);
  return associates;
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

function generateFakeOccurrences(associates, count, multiplier = 5) {
  const occurrences = [];
  const occurrenceCodes = occurrenceTypes.map((type) => type.code);
  const actualCount = Math.floor(count * multiplier);

  for (let i = 0; i < actualCount; i++) {
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
function generateFakeCorrectiveActions(
  associates,
  rules,
  occurrenceCount,
  multiplier = null
) {
  const correctiveActions = [];
  const levels = [1, 2, 3, 4];

  // If multiplier is provided, use it, otherwise use 40-70% of occurrence count
  const targetCount = multiplier
    ? Math.floor(occurrenceCount * multiplier)
    : Math.floor(occurrenceCount * faker.number.float({ min: 0.4, max: 0.7 }));

  for (let i = 0; i < targetCount; i++) {
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
          date: correctiveAction.date,
        },
      });

      if (existingCorrectiveAction) {
        // If it exists, update it
        await prisma.correctiveAction.update({
          where: { id: existingCorrectiveAction.id },
          data: {
            description: correctiveAction.description,
            level: correctiveAction.level,
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

// Modified function to generate fake notifications
function generateFakeNotifications(
  associates,
  occurrenceCount,
  multiplier = null
) {
  const notifications = [];
  const notificationTypes = ["OCCURRENCE"];

  // If multiplier is provided, use it, otherwise use 40-70% of occurrence count
  const targetCount = multiplier
    ? Math.floor(occurrenceCount * multiplier)
    : Math.floor(occurrenceCount * faker.number.float({ min: 0.4, max: 0.7 }));

  for (let i = 0; i < targetCount; i++) {
    const associate = faker.helpers.arrayElement(associates);
    if (associate && associate.id) {
      notifications.push({
        associateId: associate.id,
        date: faker.date.past(),
        type: faker.helpers.arrayElement(notificationTypes),
        level: faker.number.int({ min: 1, max: 4 }).toString(),
        totalPoints: faker.number.float({ min: 0, max: 10, multipleOf: 0.1 }),
        description: faker.lorem.sentence(),
      });
    }
  }

  return notifications;
}

async function generateFakeFiles(occurrenceCount, multiplier = 0.5) {
  const files = [];
  const mimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "text/plain",
  ];

  // Fetch existing associates, notifications, and corrective actions
  const associates = await prisma.associate.findMany();
  const notifications = await prisma.notification.findMany();
  const correctiveActions = await prisma.correctiveAction.findMany();

  if (associates.length === 0) {
    console.log("No associates found. Cannot generate files.");
    return files;
  }

  if (notifications.length === 0 && correctiveActions.length === 0) {
    console.log(
      "No notifications or corrective actions found. Cannot generate files."
    );
    return files;
  }

  const count = Math.floor(occurrenceCount * multiplier);

  for (let i = 0; i < count; i++) {
    const associate = faker.helpers.arrayElement(associates);
    const isNotification = faker.datatype.boolean();

    let fileData = {
      filename: faker.system.fileName(),
      mimetype: faker.helpers.arrayElement(mimeTypes),
      content: Buffer.from(faker.lorem.paragraphs(3)),
      size: faker.number.int({ min: 1000, max: 1000000 }),
      associateId: associate.id,
    };

    if (isNotification && notifications.length > 0) {
      const notification = faker.helpers.arrayElement(notifications);
      fileData.notificationId = notification.id;
    } else if (correctiveActions.length > 0) {
      const correctiveAction = faker.helpers.arrayElement(correctiveActions);
      fileData.correctiveActionId = correctiveAction.id;
    } else if (notifications.length > 0) {
      const notification = faker.helpers.arrayElement(notifications);
      fileData.notificationId = notification.id;
    } else {
      continue;
    }

    files.push(fileData);
  }

  return files;
}

// Modified function to upsert files with relationships
async function upsertFiles(files) {
  let upsertedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    try {
      if (
        !file.associateId ||
        (!file.notificationId && !file.correctiveActionId)
      ) {
        console.error(
          "File must have an associateId and either a notificationId or correctiveActionId. Skipping file."
        );
        skippedCount++;
        continue;
      }

      // Check if a similar file already exists
      const existingFile = await prisma.file.findFirst({
        where: {
          filename: file.filename,
          associateId: file.associateId,
          ...(file.notificationId
            ? { notificationId: file.notificationId }
            : {}),
          ...(file.correctiveActionId
            ? { correctiveActionId: file.correctiveActionId }
            : {}),
        },
      });

      if (existingFile) {
        // Update existing file
        await prisma.file.update({
          where: { id: existingFile.id },
          data: {
            mimetype: file.mimetype,
            content: file.content,
            size: file.size,
          },
        });
      } else {
        // Create new file
        await prisma.file.create({
          data: file,
        });
      }

      upsertedCount++;
    } catch (error) {
      console.error(`Error processing file: ${error.message}`);
      skippedCount++;
    }
  }

  console.log(`${upsertedCount} files upserted.`);
  console.log(`${skippedCount} files skipped due to errors.`);
}

async function upsertNotifications(notifications) {
  let upsertedCount = 0;
  let skippedCount = 0;

  for (const notification of notifications) {
    try {
      if (!notification.associateId) {
        console.error("Missing associateId. Skipping notification.");
        skippedCount++;
        continue;
      }

      // Check if a similar notification already exists
      const existingNotification = await prisma.notification.findFirst({
        where: {
          associateId: notification.associateId,
          date: notification.date,
          type: notification.type,
          level: notification.level,
        },
      });

      if (existingNotification) {
        // Update existing notification
        await prisma.notification.update({
          where: { id: existingNotification.id },
          data: {
            totalPoints: notification.totalPoints,
            description: notification.description,
          },
        });
      } else {
        // Create new notification
        await prisma.notification.create({
          data: notification,
        });
      }

      upsertedCount++;
    } catch (error) {
      console.error("Error upserting notification:", error);
      skippedCount++;
    }
  }

  console.log(`${upsertedCount} notifications upserted.`);
  console.log(`${skippedCount} notifications skipped due to errors.`);
}

async function main() {
  try {
    const argv = yargs(hideBin(process.argv))
      .option("clear", {
        type: "boolean",
        description: "Clear all data before seeding",
      })
      .option("clear-files", {
        type: "boolean",
        description: "Clear all files before seeding",
      })
      .option("occurrences-only", {
        type: "boolean",
        description: "Seed only occurrences",
      })
      .option("rules-only", {
        type: "boolean",
        description: "Seed only rules",
      })
      .option("users-only", {
        type: "boolean",
        description: "Seed only users",
      })
      .option("ca-only", {
        type: "boolean",
        description: "Seed only corrective actions",
      })
      .option("notifications-only", {
        type: "boolean",
        description: "Seed only notifications",
      })
      .option("files-only", {
        type: "boolean",
        description: "Seed only files",
      })
      .option("use-faker", {
        type: "boolean",
        description:
          "Use faker to generate data. Optionally specify number of records with --count",
      })
      .option("count", {
        type: "number",
        description: "Number of records to generate when using --use-faker",
        default: 10,
      })
      .option("occurrence-multiplier", {
        type: "number",
        description: "Multiplier for number of occurrences (default: 5)",
      })
      .option("ca-multiplier", {
        type: "number",
        description:
          "Multiplier for number of corrective actions (if not set, will use 40-70% of occurrence count)",
      })
      .option("notification-multiplier", {
        type: "number",
        description:
          "Multiplier for number of notifications (if not set, will use 40-70% of occurrence count)",
      })
      .help().argv;

    // If clear flag is set, clear all data regardless of other flags
    if (argv.clear) {
      await clearData(); // This now includes clearFiles

      // When using --clear, force faker to be used if not already set
      if (!argv.useFaker) {
        console.log(
          "Clear flag detected. Enabling faker to generate all data."
        );
        argv.useFaker = true;
      }
    } else if (argv.clearFiles) {
      // Only clear files if clear-files flag is set and clear flag is not set
      await clearFiles();
    }

    // Determine if any "only" flags are used
    const onlyFlagUsed =
      argv.occurrencesOnly ||
      argv.rulesOnly ||
      argv.usersOnly ||
      argv.caOnly ||
      argv.notificationsOnly ||
      argv.filesOnly;

    // If clear flag is set without any "only" flags, create all data
    // Otherwise, respect the "only" flags
    const createAllData = argv.clear && !onlyFlagUsed;
    const useFaker = argv.useFaker;
    const recordCount = argv.count;

    // Always upsert base data types
    if (createAllData || !onlyFlagUsed) {
      // If creating all data or no "only" flags are used, upsert all base data
      await upsertOccurrenceTypes();
      await upsertLocations();
      await upsertDepartments();
      await upsertNotificationLevels();
      await upsertRules();
    } else {
      // Selectively upsert based on flags
      if (argv.occurrencesOnly) await upsertOccurrenceTypes();
      if (argv.rulesOnly) await upsertRules();
      if (argv.notificationsOnly) await upsertNotificationLevels();
    }

    let associates = [];
    let occurrenceCount = 0;

    // Generate or fetch associates
    if (createAllData || argv.usersOnly || (!onlyFlagUsed && useFaker)) {
      if (useFaker) {
        associates = generateFakeAssociates(recordCount);
        await upsertAssociates(associates);
      } else {
        const csvPath = path.join(__dirname, associatesFileName);
        associates = await readAssociatesFromCSV(csvPath);
        if (associates.length > 0) {
          await upsertAssociates(associates);
        } else {
          console.log("No associates found in CSV.");
        }
      }
    } else if (useFaker && onlyFlagUsed) {
      // Fetch existing associates for other data generation
      associates = await fetchExistingAssociates(recordCount);
      if (associates.length === 0) {
        console.log(
          "No existing associates found. Please seed users first or use --users-only flag."
        );
        return;
      }
    }

    // Generate occurrences
    if (createAllData || argv.occurrencesOnly || (!onlyFlagUsed && useFaker)) {
      if (associates.length === 0) {
        console.log("No associates found. Cannot generate occurrences.");
      } else {
        let occurrences;
        if (useFaker) {
          const multiplier = argv.occurrenceMultiplier || 5;
          occurrences = generateFakeOccurrences(
            associates,
            recordCount,
            multiplier
          );
          occurrenceCount = occurrences.length;
        } else {
          const occurrencesCsvPath = path.join(__dirname, occurrencesFileName);
          occurrences = await readOccurrencesFromCSV(occurrencesCsvPath);
          occurrenceCount = occurrences.length;
        }
        if (occurrences.length > 0) {
          await upsertOccurrences(occurrences);
        } else {
          console.log("No occurrences found or generated.");
        }
      }
    }

    // Generate corrective actions
    if (createAllData || argv.caOnly || (!onlyFlagUsed && useFaker)) {
      const rules = await prisma.rule.findMany();
      if (associates.length === 0 || rules.length === 0) {
        console.log(
          "No associates or rules found. Cannot generate corrective actions."
        );
      } else {
        if (useFaker) {
          const correctiveActions = generateFakeCorrectiveActions(
            associates,
            rules,
            occurrenceCount,
            argv.caMultiplier
          );
          if (correctiveActions.length > 0) {
            await upsertCorrectiveActions(correctiveActions);
          } else {
            console.log("No corrective actions generated.");
          }
        } else {
          console.log(
            "No source for corrective actions data. Use --use-faker to generate them."
          );
        }
      }
    }

    // Generate notifications
    if (
      createAllData ||
      argv.notificationsOnly ||
      (!onlyFlagUsed && useFaker)
    ) {
      if (useFaker && associates.length > 0) {
        const fakeNotifications = generateFakeNotifications(
          associates,
          occurrenceCount,
          argv.notificationMultiplier
        );
        await upsertNotifications(fakeNotifications);
      } else {
        console.log(
          "No associates found or no faker count provided. Skipping notification generation."
        );
      }
    }

    // Generate files
    if (createAllData || argv.filesOnly || (!onlyFlagUsed && useFaker)) {
      if (useFaker) {
        const fakeFiles = await generateFakeFiles(occurrenceCount);
        if (fakeFiles.length > 0) {
          await upsertFiles(fakeFiles);
        } else {
          console.log(
            "No files generated. Make sure there are associates, notifications, or corrective actions in the database."
          );
        }
      } else {
        console.log(
          "No source for file data. Use --use-faker to generate them."
        );
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
