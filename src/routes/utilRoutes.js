import express from "express";
import { prisma } from "../prisma.js";

const router = express.Router();

router.get("/get-template/:type", async (req, res) => {
  const { type } = req.params;
  
  try {
    // Find the most recent template for the specified type
    const template = await prisma.file.findFirst({
      where: { 
        fileType: "TEMPLATE",
        filename: {
          contains: type === "ca" ? "ca" : "occ",
          mode: "insensitive"
        }
      },
      orderBy: { createdAt: "desc" },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.setHeader("Content-Type", template.mimetype);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${template.filename}"`
    );
    res.send(template.content);
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({ error: "Error retrieving template file" });
  }
});

router.get("/locations", async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });
    res.json(locations);
  } catch (e) {
    console.error("Error fetching locations:", e);
    res.status(500).json({ error: "Error fetching locations" });
  }
});

router.get("/departments", async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });
    res.json(departments);
  } catch (e) {
    console.error("Error fetching departments:", e);
    res.status(500).json({ error: "Error fetching departments." });
  }
});

router.get("/notification-levels", async (req, res) => {
  try {
    const { designation } = req.query;
    let notificationLevels;

    if (designation) {
      notificationLevels = await prisma.notificationLevel.findMany({
        where: {
          designation: designation,
        },
        orderBy: {
          level: "asc",
        },
      });
    } else {
      notificationLevels = await prisma.notificationLevel.findMany({
        orderBy: [{ designation: "asc" }, { level: "asc" }],
      });
    }

    const formattedLevels = notificationLevels.map((level) => ({
      designation: level.designation,
      levelNumber: level.level,
      levelText: level.name,
    }));

    res.json(formattedLevels);
  } catch (error) {
    console.error("Error fetching notification levels:", error);
    res.status(500).json({ error: "Error fetching notification levels" });
  }
});

export default router;
