import express from "express";
import { prisma } from "../server.js";

const router = express.Router();

// Get all rules
router.get("/rules", async (req, res) => {
  try {
    const rules = await prisma.rule.findMany();
    res.json(rules);
  } catch (error) {
    console.error("Error fetching rules:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get corrective actions for an associate
router.get("/corrective-actions/:associateId", async (req, res) => {
  const { associateId } = req.params;
  try {
    const correctiveActions = await prisma.correctiveAction.findMany({
      where: { associateId: associateId },
      orderBy: { date: "desc" },
      include: {
        rule: true,
        files: true,
      },
    });
    res.json(correctiveActions);
  } catch (error) {
    console.error("Error fetching corrective actions:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// Add a new corrective action
router.post("/corrective-actions", async (req, res) => {
  const { associateId, ruleId, description, level, date } = req.body;

  // Check if required fields are present
  if (!associateId || !ruleId || !description) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate level if provided
  if (
    level !== undefined &&
    (!Number.isInteger(level) || level < 0 || level > 4)
  ) {
    return res
      .status(400)
      .json({ error: "Level must be an integer between 0 and 4" });
  }

  try {
    const newCorrectiveAction = await prisma.correctiveAction.create({
      data: {
        associateId,
        ruleId,
        description,
        level: level ?? 0,
        date: date ? new Date(date) : new Date(),
      },
      include: { rule: true },
    });
    res.status(201).json(newCorrectiveAction);
  } catch (error) {
    console.error("Error creating corrective action:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a corrective action
router.put("/corrective-actions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ruleId, description, level, date } = req.body;

    if (!ruleId || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate level if provided
    if (
      level !== undefined &&
      (!Number.isInteger(level) || level < 0 || level > 4)
    ) {
      return res
        .status(400)
        .json({ error: "Level must be an integer between 0 and 4" });
    }

    const updatedCorrectiveAction = await prisma.correctiveAction.update({
      where: { id },
      data: {
        ruleId,
        description,
        level: level ?? 0,
        date: date ? new Date(date) : undefined,
      },
      include: { rule: true },
    });

    res.json(updatedCorrectiveAction);
  } catch (err) {
    console.error("Error updating corrective action:", err);
    res.status(500).json({ error: "Failed to update corrective action" });
  }
});

// Delete a corrective action
router.delete("/corrective-actions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.correctiveAction.delete({
      where: { id },
    });
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting corrective action:", error);
    res.status(500).json({ error: "Failed to delete corrective action" });
  }
});

// Get CA by type with info
router.get("/ca-by-type-with-info", async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    const caDataWithInfo = await prisma.associate.findMany({
      include: {
        correctiveActions: {
          where: {
            date: {
              gte: cutoffDate,
            },
          },
          include: {
            rule: true,
          },
        },
        occurrences: {
          where: {
            date: {
              gte: cutoffDate,
            },
          },
          include: {
            type: true,
          },
        },
      },
    });

    const formattedData = caDataWithInfo.map((associate) => ({
      id: associate.id,
      name: associate.name,
      correctiveActions: associate.correctiveActions,
      info: {
        id: associate.id,
        name: associate.name,
        points: associate.occurrences.reduce(
          (sum, occ) => sum + occ.type.points,
          0
        ),
        designation: associate.designation,
      },
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching CA by type data with associate info:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

export default router;
