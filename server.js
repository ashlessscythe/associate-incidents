import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("/api/associates", async (req, res) => {
  const associates = await prisma.associate.findMany();
  res.json(associates);
});

app.get("/api/incidents/:associateId", async (req, res) => {
  const { associateId } = req.params;
  const incidents = await prisma.incident.findMany({
    where: { associateId },
    orderBy: { date: "desc" },
  });
  res.json(incidents);
});

app.get("/api/incident-types", async (req, res) => {
  const incidentTypes = await prisma.incidentType.findMany();
  res.json(incidentTypes);
});

app.post("/api/incidents", async (req, res) => {
  const { typeId, description, isVerbal, associateId } = req.body;

  try {
    const newIncident = await prisma.incident.create({
      data: {
        typeId,
        description,
        isVerbal,
        associateId,
        date: new Date(),
      },
    });

    res.json(newIncident);
  } catch (err) {
    console.error("failed to create incident:", err);
    res.status(500).json({ message: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
