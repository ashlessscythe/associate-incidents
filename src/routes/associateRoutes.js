import express from "express";
import { prisma } from "../server.js";
import { Prisma } from "@prisma/client";
import multer from "multer";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse";

const router = express.Router();

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
        isActive: true,
      },
    });

    const result = associates.map((associate) => ({
      id: associate.id,
      name: associate.name,
      designation: associate.designation,
      department: associate.department,
      location: associate.location,
      isActive: associate.isActive,
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

// Get all associates with occurrences
router.get("/all-with-occurrences", async (req, res) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const associates = await prisma.associate.findMany({
      include: {
        occurrences: {
          where: {
            date: {
              gte: oneYearAgo,
            },
          },
          include: {
            type: true,
          },
          orderBy: {
            date: "desc",
          },
        },
        department: true,
        location: true,
      },
    });

    const associatesWithDetails = await Promise.all(
      associates.map(async (associate) => {
        const points = associate.occurrences.reduce(
          (sum, occurrence) => sum + (occurrence.type?.points || 0),
          0
        );

        // Fetch notification levels for the associate's designation
        const notificationLevels = await prisma.notificationLevel.findMany({
          where: {
            designation: associate.designation,
          },
          orderBy: [{ level: "desc" }, { pointThreshold: "desc" }],
        });

        // Determine the current notification level
        let notificationLevel = "None";
        for (const level of notificationLevels) {
          if (points >= level.pointThreshold) {
            notificationLevel = level.name;
            break;
          }
        }

        // Structure the data according to AssociateAndOccurrences interface
        return {
          id: associate.id,
          name: associate.name,
          occurrences: associate.occurrences.map((occ) => ({
            id: occ.id,
            date: occ.date,
            notes: occ.notes,
            type: occ.type,
            associateId: occ.associateId,
          })),
          info: {
            id: associate.id,
            name: associate.name,
            points: points,
            notificationLevel: notificationLevel,
            designation: associate.designation,
            department: associate.department,
            location: associate.location,
            isActive: associate.isActive,
          },
        };
      })
    );

    res.json(associatesWithDetails);
  } catch (error) {
    console.error("Error fetching all associates with occurrences:", error);
    res.status(500).json({ error: "Error fetching associates data" });
  }
});

// Get associate points and notification
router.get("/associates/:id/points-and-notification", async (req, res) => {
  try {
    const { id } = req.params;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const associate = await prisma.associate.findUnique({
      where: { id },
      include: {
        department: true,
        location: true,
        occurrences: {
          where: {
            date: {
              gte: oneYearAgo,
            },
          },
          select: {
            type: {
              select: {
                points: true,
              },
            },
            date: true,
          },
        },
      },
    });

    if (!associate) {
      return res.status(404).json({ error: "Associate not found" });
    }

    const points = associate.occurrences.reduce(
      (sum, occurrence) => sum + occurrence.type.points,
      0
    );

    // Fetch notification levels from the database for the associate's designation
    const notificationLevels = await prisma.notificationLevel.findMany({
      where: {
        designation: associate.designation,
      },
      orderBy: [{ level: "desc" }, { pointThreshold: "desc" }],
    });

    // Determine the current notification level based on points and designation
    let notificationLevel = "None";
    for (const level of notificationLevels) {
      if (points >= level.pointThreshold) {
        notificationLevel = level.name;
        break;
      }
    }

    const associateInfo = {
      id: associate.id,
      name: associate.name,
      points: points,
      notificationLevel: notificationLevel,
      designation: associate.designation,
      department: associate.department,
      location: associate.location,
      isActive: associate.isActive,
    };

    res.json(associateInfo);
  } catch (error) {
    console.error("Error fetching associate points and notification:", error);
    res
      .status(500)
      .json({ error: "Error fetching associate points and notification" });
  }
});

// Get all available designations
router.get("/designations", async (req, res) => {
  try {
    // Get all designation values from the schema
    const designationValues = [
      "MH",
      "CLERK",
      "OFFICE",
      "INACTIVE",
      "NONE",
    ];
    res.json(designationValues);
  } catch (error) {
    console.error("Error fetching designations:", error);
    res.status(500).json({ error: "Error fetching designations" });
  }
});

// Download associates template
router.get("/download-associates-template", (req, res) => {
  try {
    // Generate CSV content directly
    const csvContent =
      "name,designation,department,location\n" +
      "Alice Smith,OFFICE,HR,Main Office\n" +
      "Bob Johnson,CLERK,Finance,Branch A\n" +
      "Carol Williams,MH,Operations,Main Office";

    // Set appropriate headers
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=associates-template.csv"
    );

    // Send the CSV content
    res.send(csvContent);
  } catch (error) {
    console.error("Error generating template:", error);
    res.status(500).json({ error: "Error generating template" });
  }
});

// Import associates from CSV
router.post("/associates-import", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const csvData = req.file.buffer.toString();
    const records = [];
    const errors = [];
    const validDesignations = [
      "MH",
      "CLERK",
      "OFFICE",
      "INACTIVE",
      "BRUH",
      "NONE",
    ];

    // Parse CSV data
    const parser = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    for await (const record of parser) {
      records.push(record);
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const { name, designation, department, location } = record;
      const rowNumber = i + 2; // +2 because of header row and 0-indexing

      if (!name) {
        skipped++;
        errors.push({
          row: rowNumber,
          message: "Missing name",
          data: record,
        });
        continue;
      }

      // Validate designation if provided
      if (designation && !validDesignations.includes(designation)) {
        errors.push({
          row: rowNumber,
          message: `Invalid designation: ${designation}. Valid values are: ${validDesignations.join(
            ", "
          )}`,
          data: record,
        });
        skipped++;
        continue;
      }

      try {
        // Find department by name if provided
        let departmentId = null;
        if (department) {
          const departmentRecord = await prisma.department.findFirst({
            where: { name: department },
          });
          if (departmentRecord) {
            departmentId = departmentRecord.id;
          } else {
            errors.push({
              row: rowNumber,
              message: `Department not found: ${department}`,
              data: record,
            });
          }
        }

        // Find location by name if provided
        let locationId = null;
        if (location) {
          const locationRecord = await prisma.location.findFirst({
            where: { name: location },
          });
          if (locationRecord) {
            locationId = locationRecord.id;
          } else {
            errors.push({
              row: rowNumber,
              message: `Location not found: ${location}`,
              data: record,
            });
          }
        }

        // Check if the associate already exists by name
        const existingAssociate = await prisma.associate.findFirst({
          where: { name },
        });

        if (existingAssociate) {
          // Update existing associate
          await prisma.associate.update({
            where: { id: existingAssociate.id },
            data: {
              designation: designation || existingAssociate.designation,
              departmentId: departmentId || existingAssociate.departmentId,
              locationId: locationId || existingAssociate.locationId,
            },
          });
          updated++;
        } else {
          // Create new associate
          await prisma.associate.create({
            data: {
              name,
              designation: designation || "NONE",
              departmentId,
              locationId,
              currentPoints: 0,
            },
          });
          created++;
        }
      } catch (recordError) {
        console.error(
          `Error processing record at row ${rowNumber}:`,
          recordError
        );
        errors.push({
          row: rowNumber,
          message: `Error processing record: ${recordError.message}`,
          data: record,
        });
        skipped++;
      }
    }

    res.status(200).json({
      message: `Import completed: ${created} created, ${updated} updated, ${skipped} skipped`,
      errors: errors.length > 0 ? errors : undefined,
      success: created + updated,
      skipped,
    });
  } catch (error) {
    console.error("Error importing associates:", error);
    res.status(500).json({
      error: "Error importing associates",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Download current associates list
router.get("/download-current-associates", async (req, res) => {
  try {
    const associates = await prisma.associate.findMany({
      select: {
        name: true,
        designation: true,
        department: {
          select: {
            name: true,
          },
        },
        location: {
          select: {
            name: true,
          },
        },
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    // Convert to CSV
    const csvHeader = "name,designation,department,location,status\n";
    const csvContent = associates
      .map(
        (associate) =>
          `${associate.name},${associate.designation},${associate.department?.name || ""},${associate.location?.name || ""},${associate.isActive ? "Active" : "Inactive"}`
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=current-associates.csv"
    );
    res.send(csvHeader + csvContent);
  } catch (error) {
    console.error("Error downloading current associates:", error);
    res.status(500).json({ error: "Error downloading current associates" });
  }
});

// Get associates points report
router.get("/associates-points-report", async (req, res) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const associates = await prisma.associate.findMany({
      select: {
        name: true,
        designation: true,
        isActive: true,
        department: {
          select: {
            name: true,
          },
        },
        occurrences: {
          where: {
            date: {
              gte: oneYearAgo,
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
      },
    });

    const report = associates.map((associate) => ({
      associate_name: associate.name,
      department_name: associate.department?.name || "No Department",
      associate_designation: associate.designation,
      total_points: associate.occurrences.reduce(
        (sum, occ) => sum + (occ.type?.points || 0),
        0
      ),
      status: associate.isActive ? "Active" : "Inactive",
    }));

    // Convert to CSV
    const csvHeader =
      "Associate Name,Department Name,Designation,Total Points,Status\n";
    const csvContent = report
      .map(
        (row) =>
          `${row.associate_name},${row.department_name},${row.associate_designation},${row.total_points},${row.status}`
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=associates-points-report.csv"
    );
    res.send(csvHeader + csvContent);
  } catch (error) {
    console.error("Error generating associates points report:", error);
    res.status(500).json({ error: "Error generating report" });
  }
});

// Toggle associate active status
router.put("/associates/:id/toggle-active", async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const associate = await prisma.associate.findUnique({
      where: { id }
    });

    if (!associate) {
      return res.status(404).json({ error: "Associate not found" });
    }

    const updatedAssociate = await prisma.associate.update({
      where: { id },
      data: {
        isActive: !isActive,
      }
    });

    res.json(updatedAssociate);
  } catch (error) {
    console.error("Error toggling associate active status:", error);
    res.status(500).json({ error: "Error toggling associate active status" });
  }
});

export default router;
