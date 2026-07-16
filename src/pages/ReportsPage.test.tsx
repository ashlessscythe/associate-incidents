// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReportsPage from "./ReportsPage";
import { renderWithRouter } from "@/test/react";
import { buildRule } from "@/test/fixtures";
import {
  buildCaByTypeApiRow,
  stripIsActive,
} from "@/test/caReportApiShape";

const apiMock = vi.hoisted(() => ({
  getCAByTypeWithAssociateInfo: vi.fn(),
  getRules: vi.fn(),
  getAllAssociatesWithOccurrences: vi.fn(),
  downloadAssociatesPointsReport: vi.fn(),
  getAttendanceOccurrencesReport: vi.fn(),
  getOccurrenceTypes: vi.fn(),
  getDesignations: vi.fn(),
  getRuleTypes: vi.fn(),
}));

vi.mock("../lib/api", () => apiMock);
vi.mock("../lib/correctiveActionApi", () => ({
  getRuleTypes: apiMock.getRuleTypes,
}));

const apiShapedRows = [
  buildCaByTypeApiRow({
    id: "associate-1",
    name: "Active Alex",
    info: { isActive: true },
    correctiveActions: [{ id: "ca-1", ruleId: "rule-1" }],
  }),
  buildCaByTypeApiRow({
    id: "associate-2",
    name: "Inactive Irene",
    info: { designation: "CLERK", isActive: false },
    correctiveActions: [{ id: "ca-2", ruleId: "rule-2" }],
  }),
];

describe("ReportsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.getRules.mockResolvedValue([
      buildRule({ id: "rule-1", code: "SAF-1", type: "SAFETY" as never }),
      buildRule({ id: "rule-2", code: "WRK-1", type: "WORK" as never }),
    ]);
    apiMock.getDesignations.mockResolvedValue(["MH", "CLERK"]);
    apiMock.getRuleTypes.mockResolvedValue(["SAFETY", "WORK"]);
    apiMock.getOccurrenceTypes.mockResolvedValue([
      { id: "t1", code: "LATE", description: "Late", points: 1 },
    ]);
    apiMock.getCAByTypeWithAssociateInfo.mockResolvedValue(apiShapedRows);
  });

  async function runCaReport(user: ReturnType<typeof userEvent.setup>) {
    renderWithRouter(<ReportsPage />);

    await waitFor(() => {
      expect(apiMock.getRules).toHaveBeenCalled();
    });

    await user.click(
      screen.getByRole("button", { name: /run ca by type report/i })
    );
  }

  it("filters with API-shaped payloads that include info.isActive", async () => {
    const user = userEvent.setup();
    await runCaReport(user);

    expect(await screen.findByText("Active Alex")).toBeInTheDocument();
    expect(screen.queryByText("Inactive Irene")).not.toBeInTheDocument();
    expect(
      screen.getByText(/active associates only · 2 of 2 rules enabled/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ca report options/i }));
    expect(screen.getByLabelText(/active associates only/i)).toBeChecked();
    expect(screen.getByLabelText("SAF-1")).toBeChecked();

    await user.click(screen.getByLabelText(/active associates only/i));

    expect(await screen.findByText("Inactive Irene")).toBeInTheDocument();
    expect(screen.getByText("Active Alex")).toBeInTheDocument();
    expect(
      screen.getByText(/all associates · 2 of 2 rules enabled/i)
    ).toBeInTheDocument();
  });

  it("regression: omits everyone when API-shaped payload lacks info.isActive and active-only is on", async () => {
    apiMock.getCAByTypeWithAssociateInfo.mockResolvedValue(
      apiShapedRows.map(stripIsActive)
    );
    const user = userEvent.setup();
    await runCaReport(user);

    await waitFor(() => {
      expect(apiMock.getCAByTypeWithAssociateInfo).toHaveBeenCalled();
    });

    expect(screen.queryByText("Active Alex")).not.toBeInTheDocument();
    expect(screen.queryByText("Inactive Irene")).not.toBeInTheDocument();
    expect(
      screen.getByText(/no associates found with corrective actions/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ca report options/i }));
    await user.click(screen.getByLabelText(/active associates only/i));

    expect(await screen.findByText("Active Alex")).toBeInTheDocument();
    expect(screen.getByText("Inactive Irene")).toBeInTheDocument();
  });
});
