import request from "supertest";
import jwt from "jsonwebtoken";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";

const mockPrisma = vi.hoisted(() => ({
  occurrenceType: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  attendanceOccurrence: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  associate: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  location: {
    findUnique: vi.fn(),
  },
  department: {
    findUnique: vi.fn(),
  },
  designationVisibility: {
    findMany: vi.fn(),
  },
  file: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockExcelUtils = vi.hoisted(() => ({
  getTemplate: vi.fn(),
  generateExcelOccurrence: vi.fn(),
  generateExcelCA: vi.fn(),
}));

vi.mock("../prisma.js", () => ({ prisma: mockPrisma }));
vi.mock("../utils/excelUtils.js", () => mockExcelUtils);

const app = createApp();
const authToken = jwt.sign(
  { userId: "test-user", roles: ["user-edit"], isAdmin: false },
  process.env.JWT_SECRET
);
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

function authorized(requestBuilder) {
  return requestBuilder.set("Authorization", `Bearer ${authToken}`);
}

describe("API 500 regression coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns 401 for protected routes without a token", async () => {
    const response = await request(app).get("/zapi/occurrence-types");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "No authorization header" });
    expect(mockPrisma.occurrenceType.findMany).not.toHaveBeenCalled();
  });

  it("blocks non-admin users from admin backup routes", async () => {
    const response = await authorized(request(app).post("/zapi/admin/backup"));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Admin access required" });
  });

  it("returns occurrence types for authorized users", async () => {
    mockPrisma.occurrenceType.findMany.mockResolvedValue([
      {
        id: "type-1",
        code: "LATE",
        description: "Late arrival",
        points: 1,
      },
    ]);

    const response = await authorized(request(app).get("/zapi/occurrence-types"));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: "type-1",
        code: "LATE",
        description: "Late arrival",
        points: 1,
      },
    ]);
    expect(mockPrisma.occurrenceType.findMany).toHaveBeenCalledWith({
      orderBy: {
        code: "asc",
      },
    });
  });

  it("creates an occurrence with points captured from the selected type", async () => {
    mockPrisma.occurrenceType.findUnique.mockResolvedValue({ points: 0.5 });
    mockPrisma.attendanceOccurrence.create.mockResolvedValue({
      id: "occurrence-1",
      associateId: "associate-1",
      typeId: "type-1",
      date: "2026-05-26T00:00:00.000Z",
      notes: "Late arrival",
      pointsAtTime: 0.5,
      type: {
        id: "type-1",
        code: "LATE",
        description: "Late arrival",
        points: 0.5,
      },
    });

    const response = await authorized(
      request(app).post("/zapi/attendance-occurrences")
    ).send({
      associateId: "associate-1",
      typeId: "type-1",
      date: "2026-05-26",
      notes: "Late arrival",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: "occurrence-1",
      associateId: "associate-1",
      typeId: "type-1",
      date: "2026-05-26T00:00:00.000Z",
      notes: "Late arrival",
      pointsAtTime: 0.5,
      type: {
        id: "type-1",
        code: "LATE",
        description: "Late arrival",
        points: 0.5,
      },
    });
    expect(mockPrisma.attendanceOccurrence.create).toHaveBeenCalledWith({
      data: {
        associateId: "associate-1",
        typeId: "type-1",
        date: new Date("2026-05-26"),
        notes: "Late arrival",
        pointsAtTime: 0.5,
      },
      include: { type: true },
    });
  });

  it("returns 400 when creating an occurrence without a type", async () => {
    const response = await authorized(
      request(app).post("/zapi/attendance-occurrences")
    ).send({
      associateId: "associate-1",
      date: "2026-05-26",
      notes: "Late arrival",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Missing required fields");
    expect(mockPrisma.occurrenceType.findUnique).not.toHaveBeenCalled();
  });

  it("returns 400 when creating an occurrence with an invalid date", async () => {
    const response = await authorized(
      request(app).post("/zapi/attendance-occurrences")
    ).send({
      associateId: "associate-1",
      typeId: "type-1",
      date: "not-a-date",
      notes: "Bad date",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid date");
    expect(mockPrisma.occurrenceType.findUnique).not.toHaveBeenCalled();
  });

  it("returns 400 when the occurrence type does not exist", async () => {
    mockPrisma.occurrenceType.findUnique.mockResolvedValue(null);

    const response = await authorized(
      request(app).post("/zapi/attendance-occurrences")
    ).send({
      associateId: "associate-1",
      typeId: "missing-type",
      date: "2026-05-26",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid occurrence type");
    expect(mockPrisma.attendanceOccurrence.create).not.toHaveBeenCalled();
  });

  it("returns 400 when Prisma rejects an occurrence foreign key", async () => {
    mockPrisma.occurrenceType.findUnique.mockResolvedValue({ points: 0.5 });
    mockPrisma.attendanceOccurrence.create.mockRejectedValue({ code: "P2003" });

    const response = await authorized(
      request(app).post("/zapi/attendance-occurrences")
    ).send({
      associateId: "missing-associate",
      typeId: "type-1",
      date: "2026-05-26",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid associate or type ID");
  });

  it("returns 404 when deleting a missing occurrence", async () => {
    mockPrisma.attendanceOccurrence.delete.mockRejectedValue({ code: "P2025" });

    const response = await authorized(
      request(app).delete("/zapi/attendance-occurrences/missing-occurrence")
    );

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Attendance occurrence not found");
  });

  it("returns 400 when upload is submitted without a file", async () => {
    const response = await authorized(request(app).post("/zapi/upload")).field(
      "fileType",
      "ASSOCIATE_FILE"
    );

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("File is required");
    expect(mockPrisma.file.create).not.toHaveBeenCalled();
  });

  it("returns 400 when upload has an unsupported MIME type", async () => {
    const response = await authorized(request(app).post("/zapi/upload")).attach(
      "file",
      Buffer.from("not allowed"),
      {
        filename: "script.exe",
        contentType: "application/x-msdownload",
      }
    );

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Invalid file type");
    expect(mockPrisma.file.create).not.toHaveBeenCalled();
  });

  it("returns 400 when upload uses an unknown app file type", async () => {
    const response = await authorized(request(app).post("/zapi/upload"))
      .field("fileType", "BAD_TYPE")
      .attach("file", Buffer.from("ok"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid file type");
    expect(mockPrisma.file.create).not.toHaveBeenCalled();
  });

  it("returns 400 when occurrence export request is missing required fields", async () => {
    const response = await authorized(
      request(app).post("/zapi/export-excel-occurrence")
    ).send({
      location: "Denver",
      department: "Ops",
      date: "2026-05-26",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Missing required fields");
    expect(mockPrisma.associate.findUnique).not.toHaveBeenCalled();
    expect(mockExcelUtils.generateExcelOccurrence).not.toHaveBeenCalled();
  });

  it("returns 404 when occurrence export associate cannot be found", async () => {
    mockPrisma.associate.findUnique.mockResolvedValue(null);

    const response = await authorized(
      request(app).post("/zapi/export-excel-occurrence")
    ).send({
      associateName: "Missing User",
      location: "Denver",
      department: "Ops",
      date: "2026-05-26",
      countedOccurrences: [],
      notificationLevel: "Level 1",
      notifications: [],
    });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Associate not found");
    expect(mockExcelUtils.generateExcelOccurrence).not.toHaveBeenCalled();
  });

  it("returns 400 when corrective action export request is malformed", async () => {
    const response = await authorized(
      request(app).post("/zapi/export-excel-ca")
    ).send({
      associateName: "Test User",
      location: "Denver",
      department: "Ops",
      date: "2026-05-26",
      notificationLevel: "1 - Coaching Conversation",
      correctiveActions: [],
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Missing required fields or no corrective actions provided"
    );
    expect(mockExcelUtils.generateExcelCA).not.toHaveBeenCalled();
  });

  it("creates an associate with optional department, location, and designation", async () => {
    mockPrisma.location.findUnique.mockResolvedValue({ id: "loc-1" });
    mockPrisma.department.findUnique.mockResolvedValue({ id: "dept-1" });
    mockPrisma.associate.create.mockResolvedValue({
      id: "associate-2",
      name: "Blake Builder",
      designation: "MH",
      departmentId: "dept-1",
      locationId: "loc-1",
      department: { id: "dept-1", name: "Operations" },
      location: { id: "loc-1", name: "Denver" },
    });

    const response = await authorized(request(app).post("/zapi/associates")).send({
      name: "Blake Builder",
      designation: "MH",
      departmentId: "dept-1",
      locationId: "loc-1",
    });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Blake Builder");
    expect(mockPrisma.associate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Blake Builder",
          designation: "MH",
          departmentId: "dept-1",
          locationId: "loc-1",
        }),
      })
    );
  });

  it("rejects associate creation when name is missing", async () => {
    const response = await authorized(request(app).post("/zapi/associates")).send(
      {}
    );

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Name is required");
    expect(mockPrisma.associate.create).not.toHaveBeenCalled();
  });

  it("includes isActive on CA-by-type-with-info rows", async () => {
    mockPrisma.designationVisibility.findMany.mockResolvedValue([]);
    mockPrisma.associate.findMany.mockResolvedValue([
      {
        id: "associate-1",
        name: "Active Alex",
        designation: "MH",
        isActive: true,
        pointsAdjustment: 0,
        pointTotalsEffectiveDate: null,
        correctiveActions: [
          {
            id: "ca-1",
            ruleId: "rule-1",
            rule: { id: "rule-1", code: "SAF-1", type: "SAFETY" },
          },
        ],
        occurrences: [],
      },
      {
        id: "associate-2",
        name: "Inactive Irene",
        designation: "CLERK",
        isActive: false,
        pointsAdjustment: 0,
        pointTotalsEffectiveDate: null,
        correctiveActions: [],
        occurrences: [],
      },
    ]);

    const response = await authorized(
      request(app).get("/zapi/ca-by-type-with-info")
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Active Alex",
          info: expect.objectContaining({ isActive: true }),
        }),
        expect.objectContaining({
          name: "Inactive Irene",
          info: expect.objectContaining({ isActive: false }),
        }),
      ])
    );
  });
});
