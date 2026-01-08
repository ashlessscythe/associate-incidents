import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_MAPPINGS = {
  CA: [
    { dataPoint: "associateName", cellValue: "A7", description: "Associate name" },
    { dataPoint: "location", cellValue: "F7", description: "Location" },
    { dataPoint: "department", cellValue: "H7", description: "Department" },
    { dataPoint: "date", cellValue: "J7", description: "Date" },
    {
      dataPoint: "notificationLevels",
      cellValue: JSON.stringify(["B10", "E10", "H10", "B11", "E11"]),
      description: "Notification level cells (array)",
    },
    {
      dataPoint: "currentCA",
      cellValue: JSON.stringify({ appendixA: "B13", appendixB: "B14" }),
      description: "Current CA cells (object)",
    },
    { dataPoint: "description", cellValue: "A17", description: "CA description" },
    {
      dataPoint: "previousCAs",
      cellValue: JSON.stringify([
        { date: "B28", type: "D28", reason: "G28" },
        { date: "B29", type: "D29", reason: "G29" },
        { date: "B30", type: "D30", reason: "G30" },
      ]),
      description: "Previous CAs cells (array of objects)",
    },
  ],
  OCC: [
    { dataPoint: "associateName", cellValue: "A7", description: "Associate name" },
    { dataPoint: "location", cellValue: "F7", description: "Location" },
    { dataPoint: "department", cellValue: "H7", description: "Department" },
    { dataPoint: "date", cellValue: "J7", description: "Date" },
    {
      dataPoint: "notificationLevels",
      cellValue: JSON.stringify(["B9", "E9", "H9", "B10", "E10"]),
      description: "Notification level cells (array)",
    },
    { dataPoint: "misconductText", cellValue: "A14", description: "Misconduct text" },
    {
      dataPoint: "notifications",
      cellValue: JSON.stringify([
        { date: "B24", type: "D24", points: "G24" },
        { date: "B25", type: "D25", points: "G25" },
        { date: "B26", type: "D26", points: "G26" },
        { date: "B27", type: "D27", points: "G27" },
      ]),
      description: "Notifications cells (array of objects)",
    },
  ],
};

async function seedTemplateMappings() {
  console.log("Seeding template mappings...");

  try {
    for (const [templateType, mappings] of Object.entries(DEFAULT_MAPPINGS)) {
      for (const mapping of mappings) {
        await prisma.templateMapping.upsert({
          where: {
            templateType_dataPoint: {
              templateType,
              dataPoint: mapping.dataPoint,
            },
          },
          update: {
            cellValue: mapping.cellValue,
            description: mapping.description,
          },
          create: {
            templateType,
            dataPoint: mapping.dataPoint,
            cellValue: mapping.cellValue,
            description: mapping.description,
          },
        });
        console.log(`✓ Created/updated ${templateType} mapping: ${mapping.dataPoint}`);
      }
    }

    console.log("Template mappings seeded successfully!");
  } catch (error) {
    console.error("Error seeding template mappings:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTemplateMappings();

