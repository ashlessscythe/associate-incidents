import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../server.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

// Upload a file
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const { originalname, filename, mimetype, size } = req.file;
  const { associateId } = req.body;

  try {
    const newFile = await prisma.file.create({
      data: {
        filename: originalname,
        path: filename,
        associateId: associateId,
        mimetype: mimetype,
        size: size,
      },
    });

    res.status(201).json(newFile);
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Error uploading file" });
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

// Download a file (updated route)
router.get("/files/download/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const filePath = path.join(process.cwd(), "uploads", file.path);

    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", file.mimetype);
      res.download(filePath, file.filename);
    } else {
      res.status(404).json({ error: "File not found on server" });
    }
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ error: "Error downloading file" });
  }
});

// Delete a file
router.delete("/files/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const filePath = path.join(process.cwd(), "uploads", file.path);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

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
