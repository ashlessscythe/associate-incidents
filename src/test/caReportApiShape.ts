/**
 * Fixtures shaped like `/zapi/ca-by-type-with-info` responses.
 * Prefer these over rich UI fixtures when testing the active-only toggle so
 * regressions from a missing `info.isActive` field are not masked.
 */

export type CaByTypeApiRow = {
  id: string;
  name: string;
  correctiveActions: Array<{ id: string; ruleId: string }>;
  info: {
    id: string;
    name: string;
    points: number;
    occurrencePoints: number;
    pointsAdjustment: number;
    designation: string;
    isActive?: boolean;
  };
};

export function buildCaByTypeApiRow(
  overrides: Partial<CaByTypeApiRow> & {
    info?: Partial<CaByTypeApiRow["info"]>;
  } = {}
): CaByTypeApiRow {
  const id = overrides.id ?? "associate-1";
  const name = overrides.name ?? "Active Alex";
  const { info: infoOverrides, ...rest } = overrides;

  return {
    id,
    name,
    correctiveActions: [
      { id: "ca-1", ruleId: "rule-1" },
    ],
    ...rest,
    info: {
      id,
      name,
      points: 0,
      occurrencePoints: 0,
      pointsAdjustment: 0,
      designation: "MH",
      isActive: true,
      ...infoOverrides,
    },
  };
}

/** Historical/buggy payload shape before `isActive` was included on `info`. */
export function stripIsActive(row: CaByTypeApiRow): CaByTypeApiRow {
  const { isActive: _ignored, ...infoWithoutActive } = row.info;
  return {
    ...row,
    info: infoWithoutActive,
  };
}
