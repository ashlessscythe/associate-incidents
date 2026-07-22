import request from "supertest";
import jwt from "jsonwebtoken";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";

const mockPrisma = vi.hoisted(() => ({
  associate: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  designationVisibility: {
    findMany: vi.fn(),
  },
  notificationLevel: {
    findMany: vi.fn(),
  },
}));

vi.mock("../prisma.js", () => ({ prisma: mockPrisma }));

const app = createApp();
const authToken = jwt.sign(
  { userId: "test-user", roles: ["user-edit"], isAdmin: false },
  process.env.JWT_SECRET
);
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

function authorized(requestBuilder) {
  return requestBuilder.set("Authorization", `Bearer ${authToken}`);
}

const recentOccurrenceDate = "2026-06-01T00:00:00.000Z";

const clerkLevels = [
  {
    id: "lvl-1",
    designation: "CLERK",
    level: 1,
    name: "Verbal",
    pointThreshold: 3,
  },
  {
    id: "lvl-2",
    designation: "CLERK",
    level: 2,
    name: "Written",
    pointThreshold: 6,
  },
];

describe("associate points integrity with manual adjustments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.designationVisibility.findMany.mockResolvedValue([]);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it("includes adjustment-only points in totals and notification level", async () => {
    mockPrisma.associate.findUnique.mockResolvedValue({
      id: "assoc-1",
      name: "Blake Klein",
      designation: "CLERK",
      isActive: true,
      pointsAdjustment: 4,
      pointTotalsEffectiveDate: null,
      department: null,
      location: null,
      occurrences: [],
    });
    mockPrisma.notificationLevel.findMany.mockResolvedValue(clerkLevels);

    const response = await authorized(
      request(app).get("/zapi/associates/assoc-1/points-and-notification")
    );

    expect(response.status).toBe(200);
    expect(response.body.occurrencePoints).toBe(0);
    expect(response.body.pointsAdjustment).toBe(4);
    expect(response.body.points).toBe(4);
    expect(response.body.notificationLevel).toBe("Verbal");
    expect(mockPrisma.notificationLevel.findMany).toHaveBeenCalledWith({
      where: { designation: "CLERK" },
      orderBy: [{ level: "desc" }, { pointThreshold: "desc" }],
    });
  });

  it("sums occurrence points and adjustment when computing level", async () => {
    mockPrisma.associate.findUnique.mockResolvedValue({
      id: "assoc-2",
      name: "Bridget Wisoky",
      designation: "CLERK",
      isActive: true,
      pointsAdjustment: 2,
      pointTotalsEffectiveDate: null,
      department: null,
      location: null,
      occurrences: [
        {
          date: recentOccurrenceDate,
          type: { points: 1 },
        },
        {
          date: recentOccurrenceDate,
          type: { points: 1 },
        },
      ],
    });
    mockPrisma.notificationLevel.findMany.mockResolvedValue(clerkLevels);

    const response = await authorized(
      request(app).get("/zapi/associates/assoc-2/points-and-notification")
    );

    expect(response.status).toBe(200);
    expect(response.body.occurrencePoints).toBe(2);
    expect(response.body.pointsAdjustment).toBe(2);
    expect(response.body.points).toBe(4);
    expect(response.body.notificationLevel).toBe("Verbal");
  });

  it("stays at None when designation has no notification levels", async () => {
    mockPrisma.associate.findUnique.mockResolvedValue({
      id: "assoc-3",
      name: "Office Associate",
      designation: "OFFICE",
      isActive: true,
      pointsAdjustment: 4,
      pointTotalsEffectiveDate: null,
      department: null,
      location: null,
      occurrences: [],
    });
    mockPrisma.notificationLevel.findMany.mockResolvedValue([]);

    const response = await authorized(
      request(app).get("/zapi/associates/assoc-3/points-and-notification")
    );

    expect(response.status).toBe(200);
    expect(response.body.points).toBe(4);
    expect(response.body.notificationLevel).toBe("None");
  });

  it("does not reach a higher level when adjustment alone is below next threshold", async () => {
    mockPrisma.associate.findUnique.mockResolvedValue({
      id: "assoc-4",
      name: "Near Threshold",
      designation: "CLERK",
      isActive: true,
      pointsAdjustment: 5,
      pointTotalsEffectiveDate: null,
      department: null,
      location: null,
      occurrences: [],
    });
    mockPrisma.notificationLevel.findMany.mockResolvedValue(clerkLevels);

    const response = await authorized(
      request(app).get("/zapi/associates/assoc-4/points-and-notification")
    );

    expect(response.status).toBe(200);
    expect(response.body.points).toBe(5);
    expect(response.body.notificationLevel).toBe("Verbal");
  });

  it("reflects adjustment integrity on all-with-occurrences list payload", async () => {
    mockPrisma.associate.findMany.mockResolvedValue([
      {
        id: "assoc-5",
        name: "List Associate",
        designation: "CLERK",
        isActive: true,
        pointsAdjustment: 4,
        pointTotalsEffectiveDate: null,
        department: null,
        location: null,
        occurrences: [],
      },
    ]);
    mockPrisma.notificationLevel.findMany.mockResolvedValue(clerkLevels);

    const response = await authorized(
      request(app).get("/zapi/all-with-occurrences")
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].info).toEqual(
      expect.objectContaining({
        occurrencePoints: 0,
        pointsAdjustment: 4,
        points: 4,
        notificationLevel: "Verbal",
      })
    );
  });

  it("persists points adjustment and recomputes level on subsequent read", async () => {
    mockPrisma.associate.update.mockResolvedValue({
      id: "assoc-6",
      name: "Adjustable",
      pointsAdjustment: 4,
    });

    const putResponse = await authorized(
      request(app).put("/zapi/associates/assoc-6/points-adjustment")
    ).send({ pointsAdjustment: 4 });

    expect(putResponse.status).toBe(200);
    expect(putResponse.body.pointsAdjustment).toBe(4);
    expect(mockPrisma.associate.update).toHaveBeenCalledWith({
      where: { id: "assoc-6" },
      data: { pointsAdjustment: 4 },
      select: {
        id: true,
        name: true,
        pointsAdjustment: true,
      },
    });

    mockPrisma.associate.findUnique.mockResolvedValue({
      id: "assoc-6",
      name: "Adjustable",
      designation: "CLERK",
      isActive: true,
      pointsAdjustment: 4,
      pointTotalsEffectiveDate: null,
      department: null,
      location: null,
      occurrences: [],
    });
    mockPrisma.notificationLevel.findMany.mockResolvedValue(clerkLevels);

    const getResponse = await authorized(
      request(app).get("/zapi/associates/assoc-6/points-and-notification")
    );

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.points).toBe(4);
    expect(getResponse.body.pointsAdjustment).toBe(4);
    expect(getResponse.body.notificationLevel).toBe("Verbal");
  });

  it("rejects non-numeric points adjustment updates", async () => {
    const response = await authorized(
      request(app).put("/zapi/associates/assoc-7/points-adjustment")
    ).send({ pointsAdjustment: "not-a-number" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("pointsAdjustment must be a number");
    expect(mockPrisma.associate.update).not.toHaveBeenCalled();
  });
});
