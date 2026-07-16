export type CAReportRule = {
  id: string;
  code: string;
  type: string;
};

export type CAReportAction = {
  ruleId: string;
};

export type CAReportRow = {
  id: string;
  name: string;
  correctiveActions: CAReportAction[];
  info: {
    designation: string;
    /** Absent on older API payloads; treated as inactive by the filter. */
    isActive?: boolean;
  };
};

export function summarizeCorrectiveActionsByRuleCode(
  correctiveActions: CAReportAction[],
  rules: CAReportRule[],
  enabledRuleCodes?: Set<string> | null
): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const ca of correctiveActions) {
    const rule = rules.find((r) => r.id === ca.ruleId);
    if (!rule) continue;
    if (enabledRuleCodes && !enabledRuleCodes.has(rule.code)) continue;
    totals[rule.code] = (totals[rule.code] || 0) + 1;
  }

  return totals;
}

export function formatCaTotals(totals: Record<string, number>): string {
  return Object.entries(totals)
    .sort(([ruleA], [ruleB]) => ruleA.localeCompare(ruleB))
    .map(([code, count]) => `${code}:${count}`)
    .join("; ");
}

export function filterCAReportRows(
  rows: CAReportRow[],
  options: {
    filter?: string;
    selectedDesignation?: string;
    selectedRuleType?: string;
    activeOnly?: boolean;
    enabledRuleCodes?: Set<string> | null;
    rules: CAReportRule[];
  }
): CAReportRow[] {
  const {
    filter = "",
    selectedDesignation = "ALL",
    selectedRuleType = "ALL",
    activeOnly = false,
    enabledRuleCodes = null,
    rules,
  } = options;

  return rows
    .map((associate) => {
      const filteredActions = associate.correctiveActions.filter((ca) => {
        const rule = rules.find((r) => r.id === ca.ruleId);
        if (!rule) return false;
        if (enabledRuleCodes && !enabledRuleCodes.has(rule.code)) return false;
        if (selectedRuleType !== "ALL" && rule.type !== selectedRuleType) {
          return false;
        }
        return true;
      });

      return {
        ...associate,
        correctiveActions: filteredActions,
      };
    })
    .filter((associate) => {
      const nameMatch = associate.name
        .toLowerCase()
        .includes(filter.toLowerCase());
      const designationMatch =
        selectedDesignation === "ALL" ||
        associate.info.designation === selectedDesignation;
      const activeMatch =
        !activeOnly || associate.info.isActive === true;
      const hasVisibleActions = associate.correctiveActions.length > 0;
      return nameMatch && designationMatch && activeMatch && hasVisibleActions;
    });
}
