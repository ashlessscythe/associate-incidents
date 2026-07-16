// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReportsPage from "./ReportsPage";
import { renderWithRouter } from "@/test/react";
import { buildAssociateInfo, buildCorrectiveAction, buildRule } from "@/test/fixtures";

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
    apiMock.getCAByTypeWithAssociateInfo.mockResolvedValue([
      {
        id: "associate-1",
        name: "Active Alex",
        correctiveActions: [
          buildCorrectiveAction({
            id: "ca-1",
            ruleId: "rule-1",
            rule: buildRule({ id: "rule-1", code: "SAF-1" }),
          }),
        ],
        info: buildAssociateInfo({
          id: "associate-1",
          name: "Active Alex",
          isActive: true,
        }),
      },
      {
        id: "associate-2",
        name: "Inactive Irene",
        correctiveActions: [
          buildCorrectiveAction({
            id: "ca-2",
            ruleId: "rule-2",
            rule: buildRule({ id: "rule-2", code: "WRK-1", type: "WORK" as never }),
          }),
        ],
        info: buildAssociateInfo({
          id: "associate-2",
          name: "Inactive Irene",
          designation: "CLERK",
          isActive: false,
        }),
      },
    ]);
  });

  it("runs the CA report and toggles active-only filtering", async () => {
    const user = userEvent.setup();
    renderWithRouter(<ReportsPage />);

    await waitFor(() => {
      expect(apiMock.getRules).toHaveBeenCalled();
    });

    await user.click(
      screen.getByRole("button", { name: /run ca by type report/i })
    );

    expect(await screen.findByText("Active Alex")).toBeInTheDocument();
    expect(screen.queryByText("Inactive Irene")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/active associates only/i)).toBeChecked();
    expect(screen.getByLabelText("SAF-1")).toBeChecked();

    await user.click(screen.getByLabelText(/active associates only/i));

    expect(await screen.findByText("Inactive Irene")).toBeInTheDocument();
  });
});
