import express from "express";
import { prisma } from "../server.js";

const router = express.Router();

// Get all associates
router.get("/associates", async (req, res) => {
  try {
    const associates = await prisma.associate.findMany({
      orderBy: { name: "asc" },
    });
    res.json(associates);
  } catch (error) {
    res.status(500).json({ error: "Error fetching associates" });
  }
});

// Get associate by id
router.get("/associates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const associate = await prisma.associate.findUnique({
      where: { id },
    });
    if (!associate) {
      return res.status(404).json({ error: "Associate not found" });
    }
    res.json(associate);
  } catch (error) {
    res.status(500).json({ error: "Error fetching associate" });
  }
});

// Add associate
router.post("/associates", async (req, res) => {
  try {
    const { name, currentPoints } = req.body;
    const associate = await prisma.associate.create({
      data: { name, currentPoints },
    });
    res.status(201).json(associate);
  } catch (error) {
    res.status(400).json({ error: "Invalid request payload" });
  }
});

// Modify associate
router.put("/associates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, departmentId, designation, locationId } = req.body;

    const locationExists = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!locationExists) {
      return res.status(400).json({ error: "Invalid location ID" });
    }

    const departmentExists = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!departmentExists) {
      return res.status(400).json({ error: "Invalid department ID" });
    }

    const updatedAssociate = await prisma.associate.update({
      where: { id },
      data: {
        name,
        departmentId,
        designation,
        locationId,
      },
      include: {
        department: true,
        location: true,
      },
    });

    res.json(updatedAssociate);
  } catch (error) {
    console.error("Error updating associate:", error);
    res.status(500).json({ error: "Error updating associate" });
  }
});

// Delete associate
router.delete("/associates/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const associate = await prisma.associate.findUnique({
      where: { id },
    });

    if (!associate) {
      return res.status(404).json({ error: "Associate not found" });
    }

    await prisma.associate.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    if (error.code === "P2003") {
      res.status(400).json({
        error:
          "Cannot delete associate, as there is related data in other tables.",
      });
    } else {
      console.error("Error deleting associate:", error);
      res.status(500).json({ error: "Error deleting associate" });
    }
  }
});

// Get associates with designation
router.get("/associates-with-designation", async (req, res) => {
  try {
    const associates = await prisma.associate.findMany({
      select: {
        id: true,
        name: true,
        designation: true,
        department: true,
        location: true,
      },
    });

    const result = associates.map((associate) => ({
      id: associate.id,
      name: associate.name,
      designation: associate.designation,
      department: associate.department,
      location: associate.location,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching associates with designation:", error);
    res
      .status(500)
      .json({ error: "Error fetching associates with designation" });
  }
});

// Get associates data
router.get("/associates-data", async (req, res) => {
  const months = parseInt(req.query.months) || 12;
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  try {
    const associatesData = await prisma.associate.findMany({
      select: {
        id: true,
        name: true,
        occurrences: {
          where: {
            date: {
              gte: cutoffDate,
            },
          },
          select: {
            type: {
              select: {
                points: true,
              },
            },
          },
        },
        correctiveActions: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formattedData = associatesData.map((associate) => ({
      id: associate.id,
      name: associate.name,
      currentPoints: associate.occurrences.reduce(
        (sum, occurrence) => sum + occurrence.type.points,
        0
      ),
      totalOccurrences: associate.occurrences.length,
      totalCA: associate.correctiveActions.length,
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching associates data:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching associates data" });
  }
});

export default router;
