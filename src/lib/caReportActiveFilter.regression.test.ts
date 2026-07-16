import { describe, expect, it } from "vitest";
import { filterCAReportRows } from "./caReportUtils";
import {
  buildCaByTypeApiRow,
  stripIsActive,
} from "@/test/caReportApiShape";

const rules = [
  { id: "rule-1", code: "SAF-1", type: "SAFETY" },
  { id: "rule-2", code: "WRK-1", type: "WORK" },
];

describe("CA active-only filter regression", () => {
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

  it("keeps active associates when active-only is enabled", () => {
    const filtered = filterCAReportRows(apiShapedRows, {
      activeOnly: true,
      rules,
    });

    expect(filtered.map((row) => row.name)).toEqual(["Active Alex"]);
  });

  it("shows active and inactive associates when active-only is disabled", () => {
    const filtered = filterCAReportRows(apiShapedRows, {
      activeOnly: false,
      rules,
    });

    expect(filtered.map((row) => row.name)).toEqual([
      "Active Alex",
      "Inactive Irene",
    ]);
  });

  it("regression: API payloads missing info.isActive empty the list under active-only", () => {
    // This is the production bug: /ca-by-type-with-info omitted isActive, so
    // every row looked inactive and the toggle-on state showed zero results.
    const historicalPayload = apiShapedRows.map(stripIsActive);

    const filtered = filterCAReportRows(historicalPayload, {
      activeOnly: true,
      rules,
    });

    expect(filtered).toHaveLength(0);
    expect(historicalPayload.every((row) => !("isActive" in row.info))).toBe(
      true
    );
  });

  it("regression: the same historical payload still lists rows when active-only is off", () => {
    const historicalPayload = apiShapedRows.map(stripIsActive);

    const filtered = filterCAReportRows(historicalPayload, {
      activeOnly: false,
      rules,
    });

    expect(filtered).toHaveLength(2);
  });
});
