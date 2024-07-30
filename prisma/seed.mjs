// prisma/seed.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const incidentTypes = [
    { name: "D1", description: "Minor incident" },
    { name: "D2", description: "Moderate incident" },
    { name: "D3", description: "Severe incident" },
    { name: "D4", description: "Critical incident" },
    { name: "D5", description: "Extreme incident" },
    { name: "D6", description: "Catastrophic incident" },
    { name: "D7", description: "Unforeseen incident" },
    { name: "D8", description: "Unpredictable incident" },
    { name: "D9", description: "Unforeseen and unpredictable incident" },
    { name: "D10", description: "Unforeseen and unpredictable incident" },
  ];

  for (const type of incidentTypes) {
    await prisma.incidentType.upsert({
      where: { name: type.name },
      update: {},
      create: type,
    });
  }

  const associates = [
    { id: "1", name: "John Doe" },
    { id: "2", name: "Jane Smith" },
    { id: "3", name: "Bob Johnson" },
    { id: "4", name: "Alice Hoss" },
    { id: "5", name: "Charlie Brown" },
    { id: "6", name: "David Wilson" },
    { id: "7", name: "Emily Thompson" },
    { id: "8", name: "Michael Lee" },
    { id: "9", name: "Sarah Parker" },
    { id: "10", name: "Daniel Evans" },
  ];

  for (const associate of associates) {
    await prisma.associate.upsert({
      where: { id: associate.id },
      update: { name: associate.name },
      create: associate,
    });
  }

  const incidents = [
    {
      id: "1",
      associateId: "1",
      typeName: "D1",
      description: "Late to work",
      date: new Date("2023-01-15T09:00:00Z"),
      isVerbal: true,
    },
    {
      id: "2",
      associateId: "1",
      typeName: "D2",
      description: "Missed deadline",
      date: new Date("2023-02-20T14:30:00Z"),
      isVerbal: false,
    },
    {
      id: "3",
      associateId: "2",
      typeName: "D1",
      description: "Inappropriate behavior",
      date: new Date("2023-03-10T11:15:00Z"),
      isVerbal: true,
    },
    {
      id: "4",
      associateId: "3",
      typeName: "D3",
      description: "Safety violation",
      date: new Date("2023-04-05T16:45:00Z"),
      isVerbal: false,
    },
  ];

  for (const incident of incidents) {
    const incidentType = await prisma.incidentType.findUnique({
      where: { name: incident.typeName },
    });

    if (incidentType) {
      await prisma.incident.upsert({
        where: { id: incident.id },
        update: {},
        create: {
          id: incident.id,
          associateId: incident.associateId,
          typeId: incidentType.id,
          description: incident.description,
          date: incident.date,
          isVerbal: incident.isVerbal,
        },
      });
    }
  }

  console.log("Seed data upserted successfully");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
