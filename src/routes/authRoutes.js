import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register new user
router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with pending role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        roles: {
          create: {
            role: {
              connectOrCreate: {
                where: { name: "pending" },
                create: { name: "pending", description: "Pending approval" }
              }
            }
          }
        }
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        roles: user.roles.map(ur => ur.role.name)
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
        roles: user.roles.map(ur => ur.role.name)
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// Login user
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
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
        roles: user.roles.map(ur => ur.role.name)
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
        roles: user.roles.map(ur => ur.role.name)
      }
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
            role: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        roles: user.roles.map(ur => ur.role.name)
      }
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
            role: true
          }
        }
      }
    });

    res.json({
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        roles: user.roles.map(ur => ur.role.name),
        createdAt: user.createdAt
      }))
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
          create: roles.map(roleName => ({
            role: {
              connectOrCreate: {
                where: { name: roleName },
                create: { name: roleName, description: `${roleName} role` }
              }
            }
          }))
        }
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        roles: user.roles.map(ur => ur.role.name)
      }
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
      data: { name, description }
    });

    res.json({ role });
  } catch (error) {
    console.error("Create role error:", error);
    res.status(500).json({ message: "Failed to create role" });
  }
});

router.patch("/admin/users/:id", validateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, isAdmin } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive, isAdmin },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        roles: user.roles.map(ur => ur.role.name)
      }
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// Change user password
router.patch("/admin/users/:id/password", validateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
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
            role: true
          }
        }
      }
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        roles: user.roles.map(ur => ur.role.name)
      },
      message: "Password updated successfully"
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
});

router.patch("/admin/users/:id/roles", validateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { roles } = req.body;

    // Delete existing roles
    await prisma.userRole.deleteMany({
      where: { userId: id }
    });

    // Add new roles
    const roleIds = await Promise.all(
      roles.map(async (roleName) => {
        const role = await prisma.role.findUnique({ where: { name: roleName } });
        return role.id;
      })
    );

    await prisma.userRole.createMany({
      data: roles.map((roleName, index) => ({
        userId: id,
        roleId: roleIds[index]
      }))
    });

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        roles: user.roles.map(ur => ur.role.name)
      }
    });
  } catch (error) {
    console.error("Update user roles error:", error);
    res.status(500).json({ message: "Failed to update user roles" });
  }
});

router.delete("/admin/users/:id", validateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

export default router; 