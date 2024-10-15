import express from "express";
import { prisma } from "../server.js";

const router = express.Router();

// Get notifications for a specific associate
router.get("/notifications/:associateId", async (req, res) => {
  try {
    const { associateId } = req.params;
    const { type } = req.query;
    const notifications = await prisma.notification.findMany({
      where: {
        associateId,
        type: type,
      },
      include: {
        files: true,
      },
      orderBy: { date: "desc" },
    });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Error fetching notifications" });
  }
});

// Create a new notification
router.post("/notifications", async (req, res) => {
  try {
    const { associateId, date, type, level, totalPoints, description } =
      req.body;

    const newNotification = await prisma.notification.create({
      data: {
        associateId,
        date: new Date(date),
        type,
        level,
        totalPoints: parseFloat(totalPoints),
        description,
      },
    });

    res.status(201).json(newNotification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Error creating notification" });
  }
});

// Update a notification
router.put("/notifications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { date, type, level, totalPoints, description } = req.body;

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        date: new Date(date),
        type,
        level,
        totalPoints,
        description,
      },
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ error: "Error updating notification" });
  }
});

// Delete a notification
router.delete("/notifications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Error deleting notification" });
  }
});

export default router;
