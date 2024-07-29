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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
