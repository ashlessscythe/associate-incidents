import request from "supertest";
import jwt from "jsonwebtoken";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
  role: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  location: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  department: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  userRole: {
    deleteMany: vi.fn(),
    create: vi.fn(),
  },
  templateMapping: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockEmail = vi.hoisted(() => ({
  sendWelcomeEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendPasswordResetSuccessEmail: vi.fn(),
  getEmailConfigStatus: vi.fn(() => ({ configured: false })),
}));

vi.mock("../prisma.js", () => ({ prisma: mockPrisma }));
vi.mock("../lib/emailService.js", () => mockEmail);

const app = createApp();
const adminToken = jwt.sign(
  {
    userId: "admin-1",
    email: "admin@example.com",
    isAdmin: true,
    roles: ["user-edit"],
  },
  process.env.JWT_SECRET
);
const userToken = jwt.sign(
  {
    userId: "user-1",
    email: "user@example.com",
    isAdmin: false,
    roles: ["att-view"],
  },
  process.env.JWT_SECRET
);

const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

describe("auth and admin route coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it("rejects weak registration passwords", async () => {
    const response = await request(app).post("/zapi/auth/register").send({
      email: "new@example.com",
      password: "short",
      name: "New User",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/at least 8 characters/i);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("registers pending inactive users without issuing a token", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.role.findUnique.mockResolvedValue({
      id: "role-pending",
      name: "pending",
    });
    mockPrisma.user.create.mockResolvedValue({
      id: "user-2",
      email: "new@example.com",
      name: "New User",
      isActive: false,
      isAdmin: false,
      roles: [{ role: { name: "pending" } }],
    });

    const response = await request(app).post("/zapi/auth/register").send({
      email: "new@example.com",
      password: "Str0ng!Pass",
      name: "New User",
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeUndefined();
    expect(response.body.message).toMatch(/pending/i);
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "new@example.com",
          isActive: false,
        }),
      })
    );
  });

  it("blocks login for inactive accounts", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      password: "$2a$12$invalidhash",
      isActive: false,
      isAdmin: false,
      roles: [],
    });

    const response = await request(app).post("/zapi/auth/login").send({
      email: "user@example.com",
      password: "Str0ng!Pass",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/deactivated/i);
  });

  it("returns the current user for /auth/me", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      name: "User One",
      isActive: true,
      isAdmin: false,
      roles: [{ role: { name: "att-view" } }, { role: { name: "admin" } }],
    });

    const response = await request(app)
      .get("/zapi/auth/me")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      id: "user-1",
      email: "user@example.com",
      name: "User One",
      isActive: true,
      isAdmin: false,
      roles: ["att-view"],
    });
  });

  it("requires admin for /admin/users", async () => {
    const forbidden = await request(app)
      .get("/zapi/admin/users")
      .set("Authorization", `Bearer ${userToken}`);

    expect(forbidden.status).toBe(403);

    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: "user-1",
        email: "user@example.com",
        name: "User One",
        isActive: true,
        isAdmin: false,
        roles: [{ role: { name: "att-view" } }],
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);

    const allowed = await request(app)
      .get("/zapi/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(allowed.status).toBe(200);
    expect(allowed.body.users).toHaveLength(1);
    expect(allowed.body.users[0].roles).toEqual(["att-view"]);
  });

  it("returns email configuration status for admins", async () => {
    const response = await request(app)
      .get("/zapi/auth/email-status")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: { configured: false } });
    expect(mockEmail.getEmailConfigStatus).toHaveBeenCalled();
  });
});
