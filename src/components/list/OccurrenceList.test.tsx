// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import OccurrenceList from "./OccurrenceList";
import { buildAssociateInfo, buildOccurrenceType, buildUser } from "@/test/fixtures";

const authMock = vi.hoisted(() => ({
  user: null as unknown,
}));

const apiMock = vi.hoisted(() => ({
  getNotifications: vi.fn(),
  getLocations: vi.fn(),
  getDepartments: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: authMock.user }),
}));

vi.mock("@/hooks/useOccurrencePrint", () => ({
  useOccurrencePrint: () => vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getNotifications: apiMock.getNotifications,
  getLocations: apiMock.getLocations,
  getDepartments: apiMock.getDepartments,
  deleteOccurrence: vi.fn(),
  updateOccurrence: vi.fn(),
  exportExcelOcc: vi.fn(),
  recordOccExport: vi.fn(),
  uploadOccurrenceFile: vi.fn(),
  downloadFile: vi.fn(),
  deleteFile: vi.fn(),
}));

describe("OccurrenceList summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.user = buildUser({ roles: ["att-view"] });
    apiMock.getNotifications.mockResolvedValue([]);
    apiMock.getLocations.mockResolvedValue([]);
    apiMock.getDepartments.mockResolvedValue([]);
  });

  it("renders designation, location, department, and points from associateInfo prop", async () => {
    const associateInfo = buildAssociateInfo({
      name: "Blake Associate",
      designation: "CLERK",
      points: 4,
      occurrencePoints: 3,
      pointsAdjustment: 1,
      notificationLevel: "Level 2",
      location: { id: "loc-2", name: "Austin" },
      department: { id: "dept-2", name: "Shipping" },
    });

    render(
      <OccurrenceList
        associateInfo={associateInfo}
        occurrences={[]}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
        occurrenceTypes={[buildOccurrenceType()]}
      />
    );

    expect(
      await screen.findByText("Summary for: Blake Associate")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Total Points (last 12 months): 4")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Current Notification Level: Level 2")
    ).toBeInTheDocument();
    expect(screen.getByText("Designation: CLERK")).toBeInTheDocument();
    expect(screen.getByText("Location: Austin")).toBeInTheDocument();
    expect(screen.getByText("Department: Shipping")).toBeInTheDocument();
  });

  it("updates summary fields when associateInfo prop changes", async () => {
    const first = buildAssociateInfo({
      id: "associate-1",
      name: "Alex Associate",
      designation: "MH",
      points: 1,
      location: { id: "loc-1", name: "Denver" },
      department: { id: "dept-1", name: "Operations" },
    });
    const second = buildAssociateInfo({
      id: "associate-2",
      name: "Blake Associate",
      designation: "CLERK",
      points: 7,
      location: undefined,
      department: undefined,
    });

    const { rerender } = render(
      <OccurrenceList
        associateInfo={first}
        occurrences={[]}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
        occurrenceTypes={[buildOccurrenceType()]}
      />
    );

    expect(
      await screen.findByText("Summary for: Alex Associate")
    ).toBeInTheDocument();
    expect(screen.getByText("Designation: MH")).toBeInTheDocument();
    expect(screen.getByText("Location: Denver")).toBeInTheDocument();
    expect(screen.getByText("Department: Operations")).toBeInTheDocument();
    expect(
      screen.getByText("Total Points (last 12 months): 1")
    ).toBeInTheDocument();

    rerender(
      <OccurrenceList
        associateInfo={second}
        occurrences={[]}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
        occurrenceTypes={[buildOccurrenceType()]}
      />
    );

    expect(
      screen.getByText("Summary for: Blake Associate")
    ).toBeInTheDocument();
    expect(screen.getByText("Designation: CLERK")).toBeInTheDocument();
    expect(screen.getByText("Location: Not set")).toBeInTheDocument();
    expect(screen.getByText("Department: Not set")).toBeInTheDocument();
    expect(
      screen.getByText("Total Points (last 12 months): 7")
    ).toBeInTheDocument();
  });
});
