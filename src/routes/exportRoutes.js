import express from "express";
import { prisma } from "../server.js";
import {
  getTemplate,
  generateExcelOccurrence,
  generateExcelCA,
} from "../utils/excelUtils.js";

const router = express.Router();

router.post("/export-excel-occurrence", async (req, res) => {
  try {
    const {
      associateName,
      location,
      department,
      date,
      occurrences,
      notificationLevel,
      notifications,
    } = req.body;

    const excelBuffer = await generateExcelOccurrence(
      associateName,
      location,
      department,
      date,
      occurrences,
      notificationLevel,
      notifications
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${associateName}_occurrences.xlsx`
    );

    res.send(Buffer.from(excelBuffer));
  } catch (error) {
    console.error("Error generating Excel file:", error);
    res.status(500).json({ error: "Error generating Excel file" });
  }
});

router.post("/export-excel-ca", async (req, res) => {
  try {
    const {
      associateName,
      location,
      department,
      date,
      correctiveAction,
      notificationLevel,
    } = req.body;

    if (!associateName || !correctiveAction) {
      throw new Error("Missing required fields");
    }

    const excelBuffer = await generateExcelCA(
      associateName,
      location,
      department,
      date,
      correctiveAction,
      notificationLevel
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${associateName}_corrective_action.xlsx`
    );

    res.send(Buffer.from(excelBuffer));
  } catch (error) {
    console.error("Error generating Corrective Action Excel file:", error);
    res
      .status(500)
      .json({ error: "Error generating Corrective Action Excel file" });
  }
});

router.post("/record-occ-export", async (req, res) => {
  const { associateId, exportedBy, exportedAt, location, department } =
    req.body;

  try {
    const exportRecord = await prisma.exportRecord.create({
      data: {
        associateId,
        exportedBy,
        exportedAt,
        location,
        department,
      },
    });
    res.json(exportRecord);
  } catch (error) {
    console.error("Error recording occ export:", error);
    res.status(500).json({ error: "Failed to record occ export" });
  }
});

router.get("/export-occ-records/:associateId", async (req, res) => {
  const { associateId } = req.params;

  try {
    const exportRecords = await prisma.exportRecord.findMany({
      where: { associateId },
      orderBy: { exportedAt: "desc" },
    });
    res.json(exportRecords);
  } catch (error) {
    console.error("Error fetching export occ records:", error);
    res.status(500).json({ error: "Failed to fetch export occ records" });
  }
});

export default router;
