/**
 * Rolling-window point totals and optional effective-date partition.
 * Occurrences before pointTotalsEffectiveDate (but still in the window) are excluded
 * from occurrencePoints / totals; adjustment applies only to counted occurrences.
 */

export function sumOccurrencePoints(occurrences) {
  return (occurrences || []).reduce(
    (sum, o) => sum + (o.type?.points ?? 0),
    0
  );
}

export function getRollingYearStart(now = new Date()) {
  const d = new Date(now);
  d.setFullYear(d.getFullYear() - 1);
  return d;
}

/**
 * @param {Array<{ date: string|Date, type?: { points?: number } }>} occurrences
 * @param {string|Date|null|undefined} pointTotalsEffectiveDate
 * @param {Date} [windowStart] — rolling window lower bound (default: same as associateRoutes oneYearAgo)
 * @returns {{ counted: typeof occurrences, priorInWindow: typeof occurrences }}
 */
export function partitionCountedOccurrences(
  occurrences,
  pointTotalsEffectiveDate,
  windowStart
) {
  const list = occurrences || [];
  const ws = windowStart ?? getRollingYearStart();
  const windowed = list.filter((o) => new Date(o.date) >= ws);
  if (!pointTotalsEffectiveDate) {
    return { counted: windowed, priorInWindow: [] };
  }
  const eff = new Date(pointTotalsEffectiveDate);
  const counted = windowed.filter((o) => new Date(o.date) >= eff);
  const priorInWindow = windowed.filter((o) => new Date(o.date) < eff);
  return { counted, priorInWindow };
}

/** Windowed list only (no effective-date split). */
export function occurrencesInWindow(occurrences, windowStart) {
  const ws = windowStart ?? getRollingYearStart();
  return (occurrences || []).filter((o) => new Date(o.date) >= ws);
}

export function totalPointsWithAdjustment(countedOccurrences, pointsAdjustment) {
  return sumOccurrencePoints(countedOccurrences) + (pointsAdjustment ?? 0);
}

/** Associate-level date overrides designation policy when set. */
export function resolvePointTotalsEffectiveDate(
  associatePointTotalsEffectiveDate,
  designationPointTotalsEffectiveDate
) {
  if (associatePointTotalsEffectiveDate) {
    return associatePointTotalsEffectiveDate;
  }
  return designationPointTotalsEffectiveDate ?? null;
}

export async function loadDesignationEffectiveDateMap(prisma) {
  const rows = await prisma.designationVisibility.findMany({
    select: { designation: true, pointTotalsEffectiveDate: true },
  });
  return new Map(rows.map((r) => [r.designation, r.pointTotalsEffectiveDate]));
}

export function resolvedEffectiveForAssociate(associate, visMap) {
  return resolvePointTotalsEffectiveDate(
    associate.pointTotalsEffectiveDate,
    visMap.get(associate.designation)
  );
}
