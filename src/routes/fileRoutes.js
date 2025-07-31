import express from "express";
import { prisma } from "../server.js";
import multer from "multer";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Maximum file size (1MB for regular files, 10MB for templates)
const MAX_FILE_SIZE = 1024 * 1024;
const MAX_TEMPLATE_SIZE = 10 * 1024 * 1024;

// Upload a file
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const {
      associateId,
      notificationId,
      correctiveActionId,
      attendanceOccurrenceId,
      fileType,
    } = req.body;
    const { originalname, buffer, mimetype, size } = req.file;

    // Check file size based on type
    const maxSize = fileType === "TEMPLATE" ? MAX_TEMPLATE_SIZE : MAX_FILE_SIZE;
    if (size > maxSize) {
      const sizeLimit = fileType === "TEMPLATE" ? "10MB" : "1MB";
      return res.status(400).json({ error: `File size exceeds ${sizeLimit} limit` });
    }

    const fileData = {
      filename: originalname,
      content: buffer,
      mimetype: mimetype,
      size: size,
      fileType: fileType || "ASSOCIATE_FILE",
      associateId: associateId || undefined,
      notificationId: notificationId || undefined,
      correctiveActionId: correctiveActionId || undefined,
      attendanceOccurrenceId: attendanceOccurrenceId || undefined,
    };

    const file = await prisma.file.create({
      data: fileData,
    });

    res.json({ message: "File uploaded successfully", fileId: file.id });
  } catch (error) {
    console.error("Error uploading file:", error);
    res
      .status(500)
      .json({ error: "Failed to upload file", details: error.message });
  }
});

// Get files for a specific associate
router.get("/files/:associateId", async (req, res) => {
  try {
    const { associateId } = req.params;
    const files = await prisma.file.findMany({
      where: { associateId: associateId },
      select: {
        id: true,
        filename: true,
        createdAt: true,
        mimetype: true,
        size: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Error fetching files" });
  }
});

// Download a file
router.get("/files/download/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.setHeader("Content-Type", file.mimetype);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`
    );
    res.send(file.content);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ error: "Error downloading file" });
  }
});

// Delete a file
router.delete("/files/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    await prisma.file.delete({
      where: { id: fileId },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Error deleting file" });
  }
});

// Get all templates
router.get("/templates", async (req, res) => {
  try {
    const templates = await prisma.file.findMany({
      where: { fileType: "TEMPLATE" },
      select: {
        id: true,
        filename: true,
        createdAt: true,
        mimetype: true,
        size: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Error fetching templates" });
  }
});

// Get template by type (ca or occ)
router.get("/templates/:type", async (req, res) => {
  try {
    const { type } = req.params;
    
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
    console.error("Error downloading template:", error);
    res.status(500).json({ error: "Error downloading template" });
  }
});

export default router;
