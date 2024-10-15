import express from "express";
import { prisma } from "../server.js";
import multer from "multer";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Upload a file
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { associateId, notificationId } = req.body;
    const { originalname, buffer, mimetype, size } = req.file;

    const file = await prisma.file.create({
      data: {
        filename: originalname,
        content: buffer,
        mimetype: mimetype,
        size: size,
        associateId: associateId,
        notificationId: notificationId,
      },
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

export default router;
