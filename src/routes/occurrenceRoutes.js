import express from "express";
import { prisma } from "../server.js";

const router = express.Router();

// Get all occurrence types
router.get("/occurrence-types", async (req, res) => {
  try {
    const occurrenceTypes = await prisma.occurrenceType.findMany({
      orderBy: {
        code: "asc",
      },
    });
    res.json(occurrenceTypes);
  } catch (error) {
    res.status(500).json({ error: "Error fetching occurrence types" });
  }
});

// Get attendance occurrences for a specific associate
router.get("/attendance-occurrences/:associateId", async (req, res) => {
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
router.post("/attendance-occurrences", async (req, res) => {
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

    res.json(newOccurrence);
  } catch (error) {
    res.status(500).json({ error: "Error adding attendance occurrence" });
  }
});

// Edit an attendance occurrence
router.put("/attendance-occurrences/:id", async (req, res) => {
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

// Delete an attendance occurrence
router.delete("/attendance-occurrences/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.attendanceOccurrence.delete({ where: { id } });
    res.json({ message: "Attendance occurrence deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting attendance occurrence" });
  }
});

export default router;
