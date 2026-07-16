import { describe, expect, it } from "vitest";
import {
  filterCAReportRows,
  formatCaTotals,
  summarizeCorrectiveActionsByRuleCode,
} from "./caReportUtils";

const rules = [
  { id: "r1", code: "SAF-1", type: "SAFETY" },
  { id: "r2", code: "WRK-1", type: "WORK" },
];

const rows = [
  {
    id: "a1",
    name: "Active Alex",
    correctiveActions: [{ ruleId: "r1" }, { ruleId: "r2" }, { ruleId: "r1" }],
    info: { designation: "MH", isActive: true },
  },
  {
    id: "a2",
    name: "Inactive Irene",
    correctiveActions: [{ ruleId: "r2" }],
    info: { designation: "CLERK", isActive: false },
  },
];

describe("caReportUtils", () => {
  it("summarizes corrective actions by enabled rule codes", () => {
    expect(
      summarizeCorrectiveActionsByRuleCode(rows[0].correctiveActions, rules)
    ).toEqual({ "SAF-1": 2, "WRK-1": 1 });

    expect(
      summarizeCorrectiveActionsByRuleCode(
        rows[0].correctiveActions,
        rules,
        new Set(["SAF-1"])
      )
    ).toEqual({ "SAF-1": 2 });
  });

  it("formats CA totals for CSV export", () => {
    expect(formatCaTotals({ "WRK-1": 1, "SAF-1": 2 })).toBe(
      "SAF-1:2; WRK-1:1"
    );
  });

  it("filters by active-only and enabled rule codes", () => {
    const filtered = filterCAReportRows(rows, {
      activeOnly: true,
      enabledRuleCodes: new Set(["SAF-1"]),
      rules,
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("Active Alex");
    expect(filtered[0].correctiveActions).toEqual([
      { ruleId: "r1" },
      { ruleId: "r1" },
    ]);
  });

  it("filters by designation and rule type", () => {
    const filtered = filterCAReportRows(rows, {
      selectedDesignation: "CLERK",
      selectedRuleType: "WORK",
      rules,
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("Inactive Irene");
  });

  it("treats missing isActive as inactive when active-only is on", () => {
    const filtered = filterCAReportRows(
      [
        {
          id: "a3",
          name: "Mystery Max",
          correctiveActions: [{ ruleId: "r1" }],
          info: { designation: "MH", isActive: undefined as unknown as boolean },
        },
      ],
      { activeOnly: true, rules }
    );

    expect(filtered).toHaveLength(0);
  });
});
