import React, { useEffect, useState, useMemo } from "react";
import {
  getCAByTypeWithAssociateInfo,
  getRules,
  getAllAssociatesWithOccurrences,
  AssociateAndOccurrences,
  downloadAssociatesPointsReport,
  getAttendanceOccurrencesReport,
  getOccurrenceTypes,
  getDesignations,
} from "../lib/api";
import { getRuleTypes } from "../lib/correctiveActionApi";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssociateInfo, CorrectiveAction, Rule } from "../lib/api";
import {
  ArrowUpDown,
  Download,
  FileText,
  BarChart3,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CAByTypeData {
  id: string;
  name: string;
  correctiveActions: CorrectiveAction[];
  info: AssociateInfo;
}

type OccurrencesSortField =
  | "name"
  | "designation"
  | "points"
  | "notificationLevel";
type CASortField = "name" | "designation";
type AttendanceSortField = "designation" | "code" | "name" | "date";
type SortOrder = "asc" | "desc";

interface AttendanceOccurrenceReportItem {
  designation: string;
  code: string;
  name: string;
  date: string;
  notes: string;
}

const ReportsPage: React.FC = () => {
  const [caByTypeData, setCAByTypeData] = useState<CAByTypeData[]>([]);
  const [associatesData, setAssociatesData] = useState<
    AssociateAndOccurrences[]
  >([]);
  const [attendanceOccurrencesData, setAttendanceOccurrencesData] = useState<
    AttendanceOccurrenceReportItem[]
  >([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<
    "occurrences" | "ca" | "attendance" | null
  >(null);
  const [filter, setFilter] = useState<string>("");

  // Filter states
  const [selectedDesignation, setSelectedDesignation] = useState<string>("ALL");
  const [selectedCode, setSelectedCode] = useState<string>("ALL");
  const [selectedRuleType, setSelectedRuleType] = useState<string>("ALL");

  // Sort states for each report
  const [occurrencesSortField, setOccurrencesSortField] =
    useState<OccurrencesSortField>("name");
  const [occurrencesSortOrder, setOccurrencesSortOrder] =
    useState<SortOrder>("asc");
  const [caSortField, setCASortField] = useState<CASortField>("name");
  const [caSortOrder, setCASortOrder] = useState<SortOrder>("asc");
  const [attendanceSortField, setAttendanceSortField] =
    useState<AttendanceSortField>("date");
  const [attendanceSortOrder, setAttendanceSortOrder] =
    useState<SortOrder>("desc");

  // Enum values from DB
  const [designations, setDesignations] = useState<string[]>([]);
  const [ruleTypes, setRuleTypes] = useState<string[]>([]);
  const [occurrenceCodes, setOccurrenceCodes] = useState<string[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [
          rulesData,
          designationsData,
          ruleTypesData,
          occurrenceTypesData,
        ] = await Promise.all([
          getRules(),
          getDesignations(),
          getRuleTypes(),
          getOccurrenceTypes(),
        ]);
        setRules(rulesData);
        setDesignations(designationsData);
        setRuleTypes(ruleTypesData);
        setOccurrenceCodes(occurrenceTypesData.map((ot) => ot.code));
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError("Failed to fetch initial data");
      }
    };
    fetchInitialData();
  }, []);

  const handleGetAllOccurrences = async () => {
    setLoading(true);
    setError(null);
    fetchAssociateData();
  };

  async function fetchAssociateData() {
    try {
      const associatesData: AssociateAndOccurrences[] =
        await getAllAssociatesWithOccurrences();
      setAssociatesData(associatesData);
      setActiveReport("occurrences");
    } catch (err) {
      setError("Failed to fetch all associates with occurrences");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleFetchCAByType = async () => {
    setLoading(true);
    setError(null);
    try {
      const caDataWithInfo = await getCAByTypeWithAssociateInfo();
      setCAByTypeData(caDataWithInfo);
      setActiveReport("ca");
    } catch (err) {
      setError("Failed to fetch CA by type data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAttendanceOccurrences = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAttendanceOccurrencesReport();
      setAttendanceOccurrencesData(data);
      setActiveReport("attendance");
    } catch (err) {
      setError("Failed to fetch attendance occurrences report");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearReport = () => {
    setCAByTypeData([]);
    setAssociatesData([]);
    setAttendanceOccurrencesData([]);
    setActiveReport(null);
    setError(null);
  };

  const handleDownloadPointsReport = async () => {
    try {
      await downloadAssociatesPointsReport();
    } catch (err) {
      setError("Failed to download points report");
      console.error(err);
    }
  };

  const convertToCSV = (
    data: Record<string, string | number>[],
    headers: string[],
    filename: string
  ) => {
    // Escape CSV values
    const escapeCSV = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      // If contains comma, quote, or newline, wrap in quotes and escape quotes
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Create CSV content
    const csvHeader = headers.join(",");
    const csvRows = data.map((row) =>
      headers.map((header) => escapeCSV(row[header])).join(",")
    );
    const csvContent = [csvHeader, ...csvRows].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadAttendanceOccurrencesReport = () => {
    try {
      const csvData = sortedAndFilteredAttendanceOccurrencesData.map(
        (item) => ({
          Designation: item.designation,
          Code: item.code,
          Name: item.name,
          Date: new Date(item.date).toLocaleDateString(),
          Notes: item.notes || "",
        })
      );

      convertToCSV(
        csvData,
        ["Designation", "Code", "Name", "Date", "Notes"],
        "attendance-occurrences-report.csv"
      );
    } catch (err) {
      setError("Failed to download attendance occurrences report");
      console.error(err);
    }
  };

  const handleDownloadOccurrencesReport = () => {
    try {
      const csvData = sortedAndFilteredAssociatesData.map((associate) => {
        const occurrenceCounts = associate.occurrences.reduce(
          (acc, occurrence) => {
            const typeCode = occurrence.type.code;
            acc[typeCode] = (acc[typeCode] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
        const occurrencesStr = Object.entries(occurrenceCounts)
          .map(([code, count]) => `${code}:${count}`)
          .join("; ");

        return {
          Designation: associate.info.designation,
          Name: associate.info.name,
          Points: associate.info.points,
          "Notification Level": associate.info.notificationLevel,
          Occurrences: occurrencesStr || "No occurrences",
        };
      });

      convertToCSV(
        csvData,
        ["Designation", "Name", "Points", "Notification Level", "Occurrences"],
        "occurrences-by-associate-report.csv"
      );
    } catch (err) {
      setError("Failed to download occurrences report");
      console.error(err);
    }
  };

  const handleDownloadCAReport = () => {
    try {
      const csvData = sortedAndFilteredCAByTypeData.map((associate) => {
        const caTotals: { [key: string]: number } = {};
        associate.correctiveActions.forEach((ca) => {
          const rule = rules.find((r) => r.id === ca.ruleId);
          if (rule) {
            caTotals[rule.code] = (caTotals[rule.code] || 0) + 1;
          }
        });

        const sortedCaTotals = Object.entries(caTotals)
          .sort(([ruleA], [ruleB]) => ruleA.localeCompare(ruleB))
          .map(([code, count]) => `${code}:${count}`)
          .join("; ");

        return {
          Designation: associate.info.designation,
          Name: associate.name,
          "Corrective Actions": sortedCaTotals || "No corrective actions",
        };
      });

      convertToCSV(
        csvData,
        ["Designation", "Name", "Corrective Actions"],
        "ca-by-type-report.csv"
      );
    } catch (err) {
      setError("Failed to download CA report");
      console.error(err);
    }
  };

  const filteredAssociatesData = useMemo(() => {
    return associatesData.filter((associate) => {
      const nameMatch = associate.info.name
        .toLowerCase()
        .includes(filter.toLowerCase());
      const designationMatch =
        selectedDesignation === "ALL" ||
        associate.info.designation === selectedDesignation;
      return nameMatch && designationMatch;
    });
  }, [associatesData, filter, selectedDesignation]);

  const filteredCAByTypeData = useMemo(() => {
    return caByTypeData.filter((associate) => {
      const nameMatch = associate.name
        .toLowerCase()
        .includes(filter.toLowerCase());
      const designationMatch =
        selectedDesignation === "ALL" ||
        associate.info.designation === selectedDesignation;
      const ruleTypeMatch =
        selectedRuleType === "ALL" ||
        associate.correctiveActions.some((ca) => {
          const rule = rules.find((r) => r.id === ca.ruleId);
          return rule && rule.type === selectedRuleType;
        });
      return nameMatch && designationMatch && ruleTypeMatch;
    });
  }, [caByTypeData, filter, selectedDesignation, selectedRuleType, rules]);

  const sortedAndFilteredAssociatesData = useMemo(() => {
    return [...filteredAssociatesData].sort((a, b) => {
      let comparison = 0;
      if (occurrencesSortField === "name") {
        comparison = a.info.name.localeCompare(b.info.name);
      } else if (occurrencesSortField === "designation") {
        comparison = a.info.designation.localeCompare(b.info.designation);
      } else if (occurrencesSortField === "points") {
        comparison = a.info.points - b.info.points;
      } else if (occurrencesSortField === "notificationLevel") {
        comparison = a.info.notificationLevel.localeCompare(
          b.info.notificationLevel
        );
      }
      return occurrencesSortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredAssociatesData, occurrencesSortField, occurrencesSortOrder]);

  const sortedAndFilteredCAByTypeData = useMemo(() => {
    return [...filteredCAByTypeData].sort((a, b) => {
      let comparison = 0;
      if (caSortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (caSortField === "designation") {
        comparison = a.info.designation.localeCompare(b.info.designation);
      }
      return caSortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredCAByTypeData, caSortField, caSortOrder]);

  const filteredAttendanceOccurrencesData = useMemo(() => {
    return attendanceOccurrencesData.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(filter.toLowerCase());
      const designationMatch =
        selectedDesignation === "ALL" ||
        item.designation === selectedDesignation;
      const codeMatch = selectedCode === "ALL" || item.code === selectedCode;
      return nameMatch && designationMatch && codeMatch;
    });
  }, [attendanceOccurrencesData, filter, selectedDesignation, selectedCode]);

  const sortedAndFilteredAttendanceOccurrencesData = useMemo(() => {
    return [...filteredAttendanceOccurrencesData].sort((a, b) => {
      let comparison = 0;
      if (attendanceSortField === "designation") {
        comparison = a.designation.localeCompare(b.designation);
      } else if (attendanceSortField === "code") {
        comparison = a.code.localeCompare(b.code);
      } else if (attendanceSortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (attendanceSortField === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return attendanceSortOrder === "asc" ? comparison : -comparison;
    });
  }, [
    filteredAttendanceOccurrencesData,
    attendanceSortField,
    attendanceSortOrder,
  ]);

  const renderSortIcon = (
    field: string,
    currentField: string,
    currentOrder: SortOrder
  ) => {
    if (field === currentField) {
      return (
        <ArrowUpDown
          className={`inline ml-1 h-4 w-4 ${
            currentOrder === "desc" ? "transform rotate-180" : ""
          }`}
        />
      );
    }
    return null;
  };

  const renderActiveReport = () => {
    switch (activeReport) {
      case "occurrences":
        return (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 sm:gap-4 mb-4 font-bold text-sm border-b pb-2">
              <div
                className="cursor-pointer p-2 rounded group hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
                onClick={() => {
                  if (occurrencesSortField === "designation") {
                    setOccurrencesSortOrder(
                      occurrencesSortOrder === "asc" ? "desc" : "asc"
                    );
                  } else {
                    setOccurrencesSortField("designation");
                    setOccurrencesSortOrder("asc");
                  }
                }}
              >
                <span>Designation</span>{" "}
                {renderSortIcon(
                  "designation",
                  occurrencesSortField,
                  occurrencesSortOrder
                )}
              </div>
              <div
                className="cursor-pointer p-2 rounded group hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
                onClick={() => {
                  if (occurrencesSortField === "name") {
                    setOccurrencesSortOrder(
                      occurrencesSortOrder === "asc" ? "desc" : "asc"
                    );
                  } else {
                    setOccurrencesSortField("name");
                    setOccurrencesSortOrder("asc");
                  }
                }}
              >
                <span>Name</span>{" "}
                {renderSortIcon(
                  "name",
                  occurrencesSortField,
                  occurrencesSortOrder
                )}
              </div>
              <div
                className="cursor-pointer p-2 rounded group hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
                onClick={() => {
                  if (occurrencesSortField === "points") {
                    setOccurrencesSortOrder(
                      occurrencesSortOrder === "asc" ? "desc" : "asc"
                    );
                  } else {
                    setOccurrencesSortField("points");
                    setOccurrencesSortOrder("asc");
                  }
                }}
              >
                <span>Points</span>{" "}
                {renderSortIcon(
                  "points",
                  occurrencesSortField,
                  occurrencesSortOrder
                )}
              </div>
              <div
                className="cursor-pointer p-2 rounded group hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
                onClick={() => {
                  if (occurrencesSortField === "notificationLevel") {
                    setOccurrencesSortOrder(
                      occurrencesSortOrder === "asc" ? "desc" : "asc"
                    );
                  } else {
                    setOccurrencesSortField("notificationLevel");
                    setOccurrencesSortOrder("asc");
                  }
                }}
              >
                <span>Notification Level</span>{" "}
                {renderSortIcon(
                  "notificationLevel",
                  occurrencesSortField,
                  occurrencesSortOrder
                )}
              </div>
              <div className="p-2">Occurrences</div>
              <div className="p-2">Actions</div>
            </div>
            <div className="space-y-2">
              {sortedAndFilteredAssociatesData.length > 0 ? (
                sortedAndFilteredAssociatesData.map((associate) => {
                  const occurrenceCounts = associate.occurrences.reduce(
                    (acc, occurrence) => {
                      const typeCode = occurrence.type.code;
                      acc[typeCode] = (acc[typeCode] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  );

                  return (
                    <div
                      key={associate.info.id}
                      className="grid grid-cols-1 sm:grid-cols-6 gap-2 sm:gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="p-2 text-sm">
                        {associate.info.designation}
                      </div>
                      <div className="p-2 text-sm font-semibold">
                        {associate.info.name}
                      </div>
                      <div
                        className={cn(
                          "p-2 text-sm tabular-nums",
                          associate.info.points < 0 && "text-destructive font-semibold"
                        )}
                      >
                        {associate.info.points}
                      </div>
                      <div className="p-2 text-sm">
                        {associate.info.notificationLevel}
                      </div>
                      <div className="p-2 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(occurrenceCounts).length > 0 ? (
                            Object.entries(occurrenceCounts).map(
                              ([code, count]) => (
                                <span
                                  key={code}
                                  className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded"
                                >
                                  {code}: {count}
                                </span>
                              )
                            )
                          ) : (
                            <span className="text-muted-foreground">
                              No occurrences
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-2 text-sm flex gap-2">
                        <Link
                          to={`/attendance?associateId=${associate.info.id}`}
                          className="text-primary hover:text-primary/80"
                        >
                          Occurrences
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No associates found with occurrences.
                </p>
              )}
            </div>
          </div>
        );
      case "ca":
        return (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 font-bold text-sm border-b pb-2">
              <div
                className="cursor-pointer p-2 rounded group hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
                onClick={() => {
                  if (caSortField === "designation") {
                    setCASortOrder(caSortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setCASortField("designation");
                    setCASortOrder("asc");
                  }
                }}
              >
                <span>Designation</span>{" "}
                {renderSortIcon("designation", caSortField, caSortOrder)}
              </div>
              <div
                className="cursor-pointer p-2 rounded group hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
                onClick={() => {
                  if (caSortField === "name") {
                    setCASortOrder(caSortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setCASortField("name");
                    setCASortOrder("asc");
                  }
                }}
              >
                <span>Name</span>{" "}
                {renderSortIcon("name", caSortField, caSortOrder)}
              </div>
              <div className="p-2">Corrective Actions</div>
              <div className="p-2">Links</div>
            </div>
            <div className="space-y-2">
              {sortedAndFilteredCAByTypeData.length > 0 ? (
                sortedAndFilteredCAByTypeData.map((associate) => {
                  const caTotals: { [key: string]: number } = {};
                  associate.correctiveActions.forEach((ca) => {
                    const rule = rules.find((r) => r.id === ca.ruleId);
                    if (rule) {
                      caTotals[rule.code] = (caTotals[rule.code] || 0) + 1;
                    }
                  });

                  const sortedCaTotals = Object.entries(caTotals)
                    .sort(([ruleA], [ruleB]) => ruleA.localeCompare(ruleB))
                    .reduce(
                      (acc, [rule, count]) => {
                        acc[rule] = count;
                        return acc;
                      },
                      {} as { [key: string]: number }
                    );

                  return (
                    <div
                      key={associate.id}
                      className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="p-2 text-sm">
                        {associate.info.designation}
                      </div>
                      <div className="p-2 text-sm font-semibold">
                        {associate.name}
                      </div>
                      <div className="p-2 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(sortedCaTotals).map(
                            ([code, count]) => (
                              <span
                                key={code}
                                className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded"
                              >
                                {code}: {count}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      <div className="p-2 text-sm flex gap-2">
                        <Link
                          to={`/ca?associateId=${associate.id}`}
                          className="text-primary hover:text-primary/80"
                        >
                          CA
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No associates found with corrective actions.
                </p>
              )}
            </div>
          </div>
        );
      case "attendance":
        return (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-4 mb-4 font-bold text-sm border-b pb-2">
              <div
                className="cursor-pointer p-2 rounded group hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
                onClick={() => {
                  if (attendanceSortField === "designation") {
                    setAttendanceSortOrder(
                      attendanceSortOrder === "asc" ? "desc" : "asc"
                    );
                  } else {
                    setAttendanceSortField("designation");
                    setAttendanceSortOrder("asc");
                  }
                }}
              >
                <span>Designation</span>{" "}
                {renderSortIcon(
                  "designation",
                  attendanceSortField,
                  attendanceSortOrder
                )}
              </div>
              <div
                className="cursor-pointer p-2 rounded group hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
                onClick={() => {
                  if (attendanceSortField === "code") {
                    setAttendanceSortOrder(
                      attendanceSortOrder === "asc" ? "desc" : "asc"
                    );
                  } else {
                    setAttendanceSortField("code");
                    setAttendanceSortOrder("asc");
                  }
                }}
              >
                <span>Code</span>{" "}
                {renderSortIcon(
                  "code",
                  attendanceSortField,
                  attendanceSortOrder
                )}
              </div>
              <div
                className="cursor-pointer p-2 rounded group hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
                onClick={() => {
                  if (attendanceSortField === "name") {
                    setAttendanceSortOrder(
                      attendanceSortOrder === "asc" ? "desc" : "asc"
                    );
                  } else {
                    setAttendanceSortField("name");
                    setAttendanceSortOrder("asc");
                  }
                }}
              >
                <span>Name</span>{" "}
                {renderSortIcon(
                  "name",
                  attendanceSortField,
                  attendanceSortOrder
                )}
              </div>
              <div
                className="cursor-pointer p-2 rounded group hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
                onClick={() => {
                  if (attendanceSortField === "date") {
                    setAttendanceSortOrder(
                      attendanceSortOrder === "asc" ? "desc" : "asc"
                    );
                  } else {
                    setAttendanceSortField("date");
                    setAttendanceSortOrder("desc");
                  }
                }}
              >
                <span>Date</span>{" "}
                {renderSortIcon(
                  "date",
                  attendanceSortField,
                  attendanceSortOrder
                )}
              </div>
              <div className="p-2">Notes</div>
            </div>
            <div className="space-y-2">
              {sortedAndFilteredAttendanceOccurrencesData.length > 0 ? (
                sortedAndFilteredAttendanceOccurrencesData.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="p-2 text-sm">{item.designation}</div>
                      <div className="p-2 text-sm">{item.code}</div>
                      <div className="p-2 text-sm">{item.name}</div>
                      <div className="p-2 text-sm">
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                      <div className="p-2 text-sm text-muted-foreground">
                        {item.notes || "-"}
                      </div>
                    </div>
                  )
                )
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No attendance occurrences found.
                </p>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center text-muted-foreground py-12">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Please select a report to run.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-card text-card-foreground shadow-md">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Reports
            </h1>
          </div>

          {/* Quick Actions Section */}
          <div className="mb-6 bg-muted/50 p-4 rounded-lg">
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2">
              <Download className="h-4 w-4" />
              Quick Actions
            </h2>
            <Button
              onClick={handleDownloadPointsReport}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <FileText className="w-4 h-4 mr-2" />
              Download Points Report (All Associates)
            </Button>
          </div>

          {/* Table Reports Section */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Table Reports
            </h2>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleGetAllOccurrences}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading && activeReport === "occurrences"
                    ? "Loading..."
                    : "Run Occurrences by Associate Report"}
                </Button>
                <Button
                  onClick={handleFetchCAByType}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading && activeReport === "ca"
                    ? "Loading..."
                    : "Run CA by Type Report"}
                </Button>
                <Button
                  onClick={handleFetchAttendanceOccurrences}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading && activeReport === "attendance"
                    ? "Loading..."
                    : "Run Attendance Occurrences Report"}
                </Button>
                <Button
                  onClick={handleClearReport}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Clear Report
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  placeholder="Filter by Associate Name"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full sm:w-auto sm:max-w-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Designation:</label>
              <Select
                value={selectedDesignation}
                onValueChange={setSelectedDesignation}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Designations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {designations.map((designation) => (
                    <SelectItem key={designation} value={designation}>
                      {designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {activeReport === "attendance" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Code:</label>
                <Select value={selectedCode} onValueChange={setSelectedCode}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Codes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {occurrenceCodes.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {activeReport === "ca" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Rule Type:</label>
                <Select
                  value={selectedRuleType}
                  onValueChange={setSelectedRuleType}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Rule Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {ruleTypes.map((ruleType) => (
                      <SelectItem key={ruleType} value={ruleType}>
                        {ruleType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {activeReport && (
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  onClick={
                    activeReport === "occurrences"
                      ? handleDownloadOccurrencesReport
                      : activeReport === "ca"
                        ? handleDownloadCAReport
                        : handleDownloadAttendanceOccurrencesReport
                  }
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
              </div>
            )}
          </div>
          {error && (
            <p className="text-destructive mt-2 mb-4 text-sm">{error}</p>
          )}
        </div>
      </header>
      <main className="flex-grow overflow-y-auto p-4 sm:p-6">
        <div className="container mx-auto">{renderActiveReport()}</div>
      </main>
    </div>
  );
};

export default ReportsPage;
