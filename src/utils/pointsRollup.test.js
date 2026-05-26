import { describe, expect, it, vi } from "vitest";
import {
  getRollingYearStart,
  loadDesignationEffectiveDateMap,
  occurrencesInWindow,
  partitionCountedOccurrences,
  resolvePointTotalsEffectiveDate,
  resolvedEffectiveForAssociate,
  sumOccurrencePoints,
  totalPointsWithAdjustment,
} from "./pointsRollup.js";

describe("points rollup helpers", () => {
  it("sums occurrence type points and treats missing point values as zero", () => {
    expect(
      sumOccurrencePoints([
        { type: { points: 1 } },
        { type: { points: 0.5 } },
        { type: {} },
        {},
      ])
    ).toBe(1.5);
  });

  it("calculates the rolling-year window start from the supplied date", () => {
    expect(getRollingYearStart(new Date("2026-05-26T12:00:00.000Z"))).toEqual(
      new Date("2025-05-26T12:00:00.000Z")
    );
  });

  it("filters occurrences outside the rolling window", () => {
    const windowStart = new Date("2025-05-26T00:00:00.000Z");

    expect(
      occurrencesInWindow(
        [
          { id: "old", date: "2025-05-25T23:59:59.000Z" },
          { id: "current", date: "2025-05-26T00:00:00.000Z" },
          { id: "newer", date: "2026-01-01T00:00:00.000Z" },
        ],
        windowStart
      ).map((occurrence) => occurrence.id)
    ).toEqual(["current", "newer"]);
  });

  it("partitions in-window occurrences around an effective date", () => {
    const windowStart = new Date("2025-05-26T00:00:00.000Z");
    const result = partitionCountedOccurrences(
      [
        { id: "outside-window", date: "2025-05-01T00:00:00.000Z" },
        { id: "prior", date: "2025-06-01T00:00:00.000Z" },
        { id: "counted", date: "2025-07-01T00:00:00.000Z" },
      ],
      "2025-07-01T00:00:00.000Z",
      windowStart
    );

    expect(result.priorInWindow.map((occurrence) => occurrence.id)).toEqual([
      "prior",
    ]);
    expect(result.counted.map((occurrence) => occurrence.id)).toEqual([
      "counted",
    ]);
  });

  it("counts all windowed occurrences when no effective date is set", () => {
    const result = partitionCountedOccurrences(
      [
        { id: "current", date: "2025-06-01T00:00:00.000Z" },
        { id: "newer", date: "2025-07-01T00:00:00.000Z" },
      ],
      null,
      new Date("2025-05-26T00:00:00.000Z")
    );

    expect(result.counted.map((occurrence) => occurrence.id)).toEqual([
      "current",
      "newer",
    ]);
    expect(result.priorInWindow).toEqual([]);
  });

  it("applies manual point adjustments to counted occurrences only", () => {
    expect(
      totalPointsWithAdjustment(
        [{ type: { points: 1 } }, { type: { points: 0.5 } }],
        -0.5
      )
    ).toBe(1);
  });

  it("prefers associate effective dates over designation defaults", () => {
    expect(
      resolvePointTotalsEffectiveDate("2026-01-01", "2025-01-01")
    ).toBe("2026-01-01");
    expect(resolvePointTotalsEffectiveDate(null, "2025-01-01")).toBe(
      "2025-01-01"
    );
    expect(resolvePointTotalsEffectiveDate(null, undefined)).toBeNull();
  });

  it("loads designation effective dates and resolves an associate policy", async () => {
    const prisma = {
      designationVisibility: {
        findMany: vi.fn().mockResolvedValue([
          { designation: "MH", pointTotalsEffectiveDate: "2025-07-01" },
        ]),
      },
    };

    const map = await loadDesignationEffectiveDateMap(prisma);

    expect(prisma.designationVisibility.findMany).toHaveBeenCalledWith({
      select: { designation: true, pointTotalsEffectiveDate: true },
    });
    expect(
      resolvedEffectiveForAssociate(
        {
          designation: "MH",
          pointTotalsEffectiveDate: null,
        },
        map
      )
    ).toBe("2025-07-01");
  });
});
