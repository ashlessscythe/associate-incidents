import express from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { validateToken, requireAdmin } from "../middleware/auth.js";
import process from "process";

const router = express.Router();
const prisma = new PrismaClient();

// Encryption key - must be set via environment variable
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error("BACKUP_ENCRYPTION_KEY environment variable is required");
}

if (ENCRYPTION_KEY.length !== 64) {
  throw new Error("BACKUP_ENCRYPTION_KEY must be exactly 64 characters long");
}
const ALGORITHM = "aes-256-cbc";

// Helper function to encrypt data
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
  };
}

// Helper function to decrypt data
function decrypt(encryptedData) {
  const { encrypted, iv } = encryptedData;

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    Buffer.from(iv, "hex")
  );

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Create backup of all company data
router.post("/admin/backup", validateToken, requireAdmin, async (req, res) => {
  try {
    console.log("Starting backup process...");

    // Get all data from all tables
    const [
      users,
      roles,
      userRoles,
      associates,
      locations,
      departments,
      occurrenceTypes,
      attendanceOccurrences,
      rules,
      notificationLevels,
      notifications,
      correctiveActions,
      files,
      exportRecords,
    ] = await Promise.all([
      prisma.user.findMany({
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      }),
      prisma.role.findMany(),
      prisma.userRole.findMany(),
      prisma.associate.findMany({
        include: {
          location: true,
          department: true,
          occurrences: true,
          correctiveActions: true,
          notifications: true,
          files: true,
          exportRecords: true,
        },
      }),
      prisma.location.findMany(),
      prisma.department.findMany(),
      prisma.occurrenceType.findMany(),
      prisma.attendanceOccurrence.findMany({
        include: {
          associate: true,
          type: true,
          files: true,
        },
      }),
      prisma.rule.findMany(),
      prisma.notificationLevel.findMany(),
      prisma.notification.findMany({
        include: {
          associate: true,
          files: true,
        },
      }),
      prisma.correctiveAction.findMany({
        include: {
          associate: true,
          rule: true,
          files: true,
        },
      }),
      prisma.file.findMany(),
      prisma.exportRecord.findMany({
        include: {
          associate: true,
        },
      }),
    ]);

    // Create backup object
    const backupData = {
      metadata: {
        version: "1.0",
        createdAt: new Date().toISOString(),
        createdBy: req.user.email,
        recordCounts: {
          users: users.length,
          roles: roles.length,
          userRoles: userRoles.length,
          associates: associates.length,
          locations: locations.length,
          departments: departments.length,
          occurrenceTypes: occurrenceTypes.length,
          attendanceOccurrences: attendanceOccurrences.length,
          rules: rules.length,
          notificationLevels: notificationLevels.length,
          notifications: notifications.length,
          correctiveActions: correctiveActions.length,
          files: files.length,
          exportRecords: exportRecords.length,
        },
      },
      data: {
        users,
        roles,
        userRoles,
        associates,
        locations,
        departments,
        occurrenceTypes,
        attendanceOccurrences,
        rules,
        notificationLevels,
        notifications,
        correctiveActions,
        files,
        exportRecords,
      },
    };

    // Convert to JSON string
    const jsonData = JSON.stringify(backupData, null, 2);

    // Encrypt the backup data
    const encryptedData = encrypt(jsonData);

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `company-backup-${timestamp}.json`;

    console.log(`Backup created successfully: ${filename}`);
    console.log(
      `Backup contains ${Object.values(backupData.metadata.recordCounts).reduce((a, b) => a + b, 0)} total records`
    );

    res.json({
      success: true,
      message: "Backup created successfully",
      filename,
      metadata: backupData.metadata,
      encryptedData,
    });
  } catch (error) {
    console.error("Backup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create backup",
      error: error.message,
    });
  }
});

// Restore company data from backup
router.post("/admin/restore", validateToken, requireAdmin, async (req, res) => {
  try {
    const { encryptedData, confirmRestore } = req.body;

    if (!confirmRestore) {
      return res.status(400).json({
        success: false,
        message: "Restore confirmation is required",
      });
    }

    if (!encryptedData) {
      return res.status(400).json({
        success: false,
        message: "Backup data is required",
      });
    }

    console.log("Starting restore process...");

    // Decrypt the backup data
    let backupData;
    try {
      const decryptedJson = decrypt(encryptedData);
      backupData = JSON.parse(decryptedJson);
    } catch (decryptError) {
      console.error("Decryption error:", decryptError);
      return res.status(400).json({
        success: false,
        message: "Invalid or corrupted backup data",
      });
    }

    // Validate backup structure
    if (!backupData.metadata || !backupData.data) {
      return res.status(400).json({
        success: false,
        message: "Invalid backup format",
      });
    }

    console.log(
      `Restoring backup created on ${backupData.metadata.createdAt} by ${backupData.metadata.createdBy}`
    );
    console.log(`Backup contains:`, backupData.metadata.recordCounts);

    // Start transaction for atomic restore
    await prisma.$transaction(async (tx) => {
      // Clear existing data in reverse dependency order
      console.log("Clearing existing data...");

      await tx.file.deleteMany();
      await tx.exportRecord.deleteMany();
      await tx.notification.deleteMany();
      await tx.correctiveAction.deleteMany();
      await tx.attendanceOccurrence.deleteMany();
      await tx.userRole.deleteMany();
      await tx.associate.deleteMany();
      await tx.location.deleteMany();
      await tx.department.deleteMany();
      await tx.occurrenceType.deleteMany();
      await tx.rule.deleteMany();
      await tx.notificationLevel.deleteMany();
      await tx.user.deleteMany();
      await tx.role.deleteMany();

      console.log("Existing data cleared");

      // Restore data in dependency order
      console.log("Restoring data...");

      // 1. Restore roles first
      if (backupData.data.roles.length > 0) {
        await tx.role.createMany({
          data: backupData.data.roles.map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description,
            createdAt: new Date(role.createdAt),
            updatedAt: new Date(role.updatedAt),
          })),
        });
        console.log(`Restored ${backupData.data.roles.length} roles`);
      }

      // 2. Restore users
      if (backupData.data.users.length > 0) {
        await tx.user.createMany({
          data: backupData.data.users.map((user) => ({
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
            isActive: user.isActive,
            isAdmin: user.isAdmin,
            resetToken: user.resetToken,
            resetTokenExpiry: user.resetTokenExpiry
              ? new Date(user.resetTokenExpiry)
              : null,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          })),
        });
        console.log(`Restored ${backupData.data.users.length} users`);
      }

      // 3. Restore user roles
      if (backupData.data.userRoles.length > 0) {
        await tx.userRole.createMany({
          data: backupData.data.userRoles.map((userRole) => ({
            id: userRole.id,
            userId: userRole.userId,
            roleId: userRole.roleId,
          })),
        });
        console.log(`Restored ${backupData.data.userRoles.length} user roles`);
      }

      // 4. Restore locations and departments
      if (backupData.data.locations.length > 0) {
        await tx.location.createMany({
          data: backupData.data.locations.map((location) => ({
            id: location.id,
            name: location.name,
          })),
        });
        console.log(`Restored ${backupData.data.locations.length} locations`);
      }

      if (backupData.data.departments.length > 0) {
        await tx.department.createMany({
          data: backupData.data.departments.map((department) => ({
            id: department.id,
            name: department.name,
          })),
        });
        console.log(
          `Restored ${backupData.data.departments.length} departments`
        );
      }

      // 5. Restore occurrence types and rules
      if (backupData.data.occurrenceTypes.length > 0) {
        await tx.occurrenceType.createMany({
          data: backupData.data.occurrenceTypes.map((type) => ({
            id: type.id,
            code: type.code,
            description: type.description,
            points: type.points,
          })),
        });
        console.log(
          `Restored ${backupData.data.occurrenceTypes.length} occurrence types`
        );
      }

      if (backupData.data.rules.length > 0) {
        await tx.rule.createMany({
          data: backupData.data.rules.map((rule) => ({
            id: rule.id,
            code: rule.code,
            description: rule.description,
            type: rule.type,
          })),
        });
        console.log(`Restored ${backupData.data.rules.length} rules`);
      }

      if (backupData.data.notificationLevels.length > 0) {
        await tx.notificationLevel.createMany({
          data: backupData.data.notificationLevels.map((level) => ({
            id: level.id,
            designation: level.designation,
            level: level.level,
            name: level.name,
            pointThreshold: level.pointThreshold,
          })),
        });
        console.log(
          `Restored ${backupData.data.notificationLevels.length} notification levels`
        );
      }

      // 6. Restore associates
      if (backupData.data.associates.length > 0) {
        await tx.associate.createMany({
          data: backupData.data.associates.map((associate) => ({
            id: associate.id,
            name: associate.name,
            ssoid: associate.ssoid,
            isActive: associate.isActive,
            designation: associate.designation,
            currentPoints: associate.currentPoints,
            locationId: associate.locationId,
            departmentId: associate.departmentId,
          })),
        });
        console.log(`Restored ${backupData.data.associates.length} associates`);
      }

      // 7. Restore attendance occurrences
      if (backupData.data.attendanceOccurrences.length > 0) {
        await tx.attendanceOccurrence.createMany({
          data: backupData.data.attendanceOccurrences.map((occurrence) => ({
            id: occurrence.id,
            associateId: occurrence.associateId,
            typeId: occurrence.typeId,
            date: new Date(occurrence.date),
            notes: occurrence.notes,
            pointsAtTime: occurrence.pointsAtTime,
            createdAt: new Date(occurrence.createdAt),
            updatedAt: new Date(occurrence.updatedAt),
          })),
        });
        console.log(
          `Restored ${backupData.data.attendanceOccurrences.length} attendance occurrences`
        );
      }

      // 8. Restore corrective actions
      if (backupData.data.correctiveActions.length > 0) {
        await tx.correctiveAction.createMany({
          data: backupData.data.correctiveActions.map((action) => ({
            id: action.id,
            associateId: action.associateId,
            ruleId: action.ruleId,
            level: action.level,
            description: action.description,
            date: new Date(action.date),
            createdAt: new Date(action.createdAt),
            updatedAt: new Date(action.updatedAt),
          })),
        });
        console.log(
          `Restored ${backupData.data.correctiveActions.length} corrective actions`
        );
      }

      // 9. Restore notifications
      if (backupData.data.notifications.length > 0) {
        await tx.notification.createMany({
          data: backupData.data.notifications.map((notification) => ({
            id: notification.id,
            associateId: notification.associateId,
            date: new Date(notification.date),
            type: notification.type,
            level: notification.level,
            totalPoints: notification.totalPoints,
            description: notification.description,
            createdAt: new Date(notification.createdAt),
            updatedAt: new Date(notification.updatedAt),
          })),
        });
        console.log(
          `Restored ${backupData.data.notifications.length} notifications`
        );
      }

      // 10. Restore export records
      if (backupData.data.exportRecords.length > 0) {
        await tx.exportRecord.createMany({
          data: backupData.data.exportRecords.map((record) => ({
            id: record.id,
            associateId: record.associateId,
            exportedBy: record.exportedBy,
            exportedAt: new Date(record.exportedAt),
            location: record.location,
            department: record.department,
          })),
        });
        console.log(
          `Restored ${backupData.data.exportRecords.length} export records`
        );
      }

      // 11. Restore files (last, as they reference other entities)
      if (backupData.data.files.length > 0) {
        await tx.file.createMany({
          data: backupData.data.files.map((file) => ({
            id: file.id,
            filename: file.filename,
            content: file.content,
            mimetype: file.mimetype,
            size: file.size,
            fileType: file.fileType,
            associateId: file.associateId,
            attendanceOccurrenceId: file.attendanceOccurrenceId,
            correctiveActionId: file.correctiveActionId,
            notificationId: file.notificationId,
            createdAt: new Date(file.createdAt),
            updatedAt: new Date(file.updatedAt),
          })),
        });
        console.log(`Restored ${backupData.data.files.length} files`);
      }

      console.log("Restore completed successfully");
    });

    res.json({
      success: true,
      message: "Data restored successfully",
      restoredData: backupData.metadata.recordCounts,
      restoredBy: req.user.email,
      restoredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Restore error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restore data",
      error: error.message,
    });
  }
});

// Get backup information (metadata only)
router.post(
  "/admin/backup/info",
  validateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { encryptedData } = req.body;

      if (!encryptedData) {
        return res.status(400).json({
          success: false,
          message: "Backup data is required",
        });
      }

      // Decrypt and parse only metadata
      let backupData;
      try {
        const decryptedJson = decrypt(encryptedData);
        backupData = JSON.parse(decryptedJson);
      } catch (decryptError) {
        return res.status(400).json({
          success: false,
          message: "Invalid or corrupted backup data",
        });
      }

      if (!backupData.metadata) {
        return res.status(400).json({
          success: false,
          message: "Invalid backup format",
        });
      }

      res.json({
        success: true,
        metadata: backupData.metadata,
      });
    } catch (error) {
      console.error("Backup info error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to read backup information",
        error: error.message,
      });
    }
  }
);

export default router;
