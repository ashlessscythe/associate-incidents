import express from "express";
import { prisma } from "../server.js";
import { UTApi } from "uploadthing/server";

const router = express.Router();
const utapi = new UTApi({ token: process.env.UPLOADTHING_SECRET });

router.get("/get-template/:type", async (req, res) => {
  const { type } = req.params;
  const fileKey =
    type === "ca" ? process.env.CA_TEMPLATE_KEY : process.env.OCC_TEMPLATE_KEY;

  if (!fileKey) {
    return res.status(400).send("Invalid template type");
  }

  try {
    const signedUrl = await utapi.getSignedUrl(fileKey);
    const response = await fetch(signedUrl);
    if (!response.ok) throw new Error("Failed to fetch file from UploadThing");

    const fileBuffer = await response.arrayBuffer();

    res.set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.set("Content-Disposition", `attachment; filename=${type}.xlsx`);
    res.send(Buffer.from(fileBuffer));
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).send("Error retrieving template file");
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
