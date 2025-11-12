import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import process from "process";
import { validateToken, requireAdmin } from "../middleware/auth.js";
import { passwordResetRateLimit, loginRateLimit } from "../middleware/rateLimit.js";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  getEmailConfigStatus,
} from "../lib/emailService.js";

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

// Register new user
router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Input validation
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Email, password, and name are required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Password validation
    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    // Check password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      });
    }

    // Name validation
    if (name.trim().length < 2) {
      return res
        .status(400)
        .json({ message: "Name must be at least 2 characters long" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with pending role and inactive status
    // SECURITY: New users should be inactive by default and require admin approval
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        isActive: false, // SECURITY: New users are inactive until approved by admin
        roles: {
          create: {
            role: {
              connectOrCreate: {
                where: { name: "pending" },
                create: { name: "pending", description: "Pending approval" },
              },
            },
          },
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error("Welcome email failed to send:", emailError);
      // Don't fail registration if email fails
    }

    // SECURITY: Do NOT issue JWT token for pending users
    // They must wait for admin approval before accessing the app
    res.status(201).json({
      message: "Registration successful. Your account is pending approval by an administrator.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        roles: user.roles.map((ur) => ur.role.name),
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// Login user
router.post("/auth/login", loginRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        roles: user.roles.map((ur) => ur.role.name),
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        roles: user.roles.map((ur) => ur.role.name),
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

// Get current user
router.get("/auth/me", validateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // SECURITY: Check if user is active before returning user data
    if (!user.isActive) {
      return res.status(403).json({ 
        message: "Account is deactivated. Please contact an administrator." 
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        roles: user.roles.map((ur) => ur.role.name),
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to get user" });
  }
});

// Logout (client-side token removal)
router.post("/auth/logout", validateToken, (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// Admin routes
router.get("/admin/users", validateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    res.json({
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        roles: user.roles.map((ur) => ur.role.name),
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Failed to get users" });
  }
});

router.get("/admin/roles", validateToken, requireAdmin, async (req, res) => {
  try {
    const roles = await prisma.role.findMany();
    res.json({ roles });
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({ message: "Failed to get roles" });
  }
});

router.post("/admin/users", validateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, roles } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        roles: {
          create: roles.map((roleName) => ({
            role: {
              connectOrCreate: {
                where: { name: roleName },
                create: { name: roleName, description: `${roleName} role` },
              },
            },
          })),
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        roles: user.roles.map((ur) => ur.role.name),
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
});

router.post("/admin/roles", validateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    const role = await prisma.role.create({
      data: { name, description },
    });

    res.json({ role });
  } catch (error) {
    console.error("Create role error:", error);
    res.status(500).json({ message: "Failed to create role" });
  }
});

router.patch(
  "/admin/users/:id",
  validateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive, isAdmin } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: { isActive, isAdmin },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isActive: user.isActive,
          isAdmin: user.isAdmin,
          roles: user.roles.map((ur) => ur.role.name),
        },
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  }
);

// Change user password
router.patch(
  "/admin/users/:id/password",
  validateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password || password.length < 8) {
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters long" });
      }

      // Check password strength
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message:
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update user password
      const user = await prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isActive: user.isActive,
          isAdmin: user.isAdmin,
          roles: user.roles.map((ur) => ur.role.name),
        },
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  }
);

router.patch(
  "/admin/users/:id/roles",
  validateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { roles } = req.body;

      // Delete existing roles
      await prisma.userRole.deleteMany({
        where: { userId: id },
      });

      // Add new roles
      const roleIds = await Promise.all(
        roles.map(async (roleName) => {
          const role = await prisma.role.findUnique({
            where: { name: roleName },
          });
          return role.id;
        })
      );

      await prisma.userRole.createMany({
        data: roles.map((roleName, index) => ({
          userId: id,
          roleId: roleIds[index],
        })),
      });

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isActive: user.isActive,
          isAdmin: user.isAdmin,
          roles: user.roles.map((ur) => ur.role.name),
        },
      });
    } catch (error) {
      console.error("Update user roles error:", error);
      res.status(500).json({ message: "Failed to update user roles" });
    }
  }
);

router.delete(
  "/admin/users/:id",
  validateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.user.delete({
        where: { id },
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  }
);

// Request password reset
router.post("/auth/forgot-password", passwordResetRateLimit, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // SECURITY: Prevent password reset for inactive accounts
    if (!user.isActive) {
      // Don't reveal if user exists or not for security
      return res.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error("Password reset email failed to send:", emailError);
      return res
        .status(500)
        .json({ message: "Failed to send password reset email" });
    }

    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res
      .status(500)
      .json({ message: "Failed to process password reset request" });
  }
});

// Reset password with token
router.post("/auth/reset-password", passwordResetRateLimit, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and password are required" });
    }

    // SECURITY: Match password requirements with registration (8 chars + complexity)
    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    // Check password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      });
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // SECURITY: Prevent password reset for inactive accounts
    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: "Account is deactivated. Please contact an administrator." });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // SECURITY: Clear reset token after use (single-use token)
    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Send success email
    try {
      await sendPasswordResetSuccessEmail(user.email, user.name);
    } catch (emailError) {
      console.error("Password reset success email failed to send:", emailError);
      // Don't fail the reset if email fails
    }

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

// Get email configuration status (admin only)
router.get("/auth/email-status", validateToken, requireAdmin, (req, res) => {
  try {
    const status = getEmailConfigStatus();
    res.json({ status });
  } catch (error) {
    console.error("Email status error:", error);
    res.status(500).json({ message: "Failed to get email status" });
  }
});

export default router;
