import React, { useEffect, useState, useMemo } from "react";
import {
  getCAByTypeWithAssociateInfo,
  getRules,
  getOccurrenceTypes,
  getAllAssociatesWithOccurrences,
  AssociateAndOccurrences,
  downloadAssociatesPointsReport,
} from "../lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OccurrenceByTypeRow from "@/components/list/OccurrenceByTypeRow";
import CAByTypeRow from "@/components/list/CAByTypeRow";
import {
  AssociateInfo,
  OccurrenceType,
  CorrectiveAction,
  Rule,
  Designation,
} from "../lib/api";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowUpDown, Download, FileText, BarChart3, Users } from "lucide-react";

interface CAByTypeData {
  id: string;
  name: string;
  correctiveActions: CorrectiveAction[];
  info: AssociateInfo;
}

type SortField = "name" | "points" | "notificationLevel";
type SortOrder = "asc" | "desc";

const ReportsPage: React.FC = () => {
  const [caByTypeData, setCAByTypeData] = useState<CAByTypeData[]>([]);
  const [occurrenceTypes, setOccurrenceTypes] = useState<OccurrenceType[]>([]);
  const [associatesData, setAssociatesData] = useState<
    AssociateAndOccurrences[]
  >([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<"occurrences" | "ca" | null>(
    null
  );
  const [filter, setFilter] = useState<string>("");
  const [selectedDesignation, setSelectedDesignation] = useState<
    Designation | "ALL"
  >("ALL");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [rulesData, occurrenceTypesData] = await Promise.all([
          getRules(),
          getOccurrenceTypes(),
        ]);
        setRules(rulesData);
        setOccurrenceTypes(occurrenceTypesData);
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

  const handleClearReport = () => {
    setCAByTypeData([]);
    setAssociatesData([]);
    setActiveReport(null);
    setError(null);
  };

  const handleDeleteOccurrence = async (occurrenceId: string) => {
    console.log("Delete Occurrence:", occurrenceId);
  };

  const handleUpdateOccurrence = async (associateId: string) => {
    console.log("Update Occurrences for Associate:", associateId);
  };

  const handleDownloadPointsReport = async () => {
    try {
      await downloadAssociatesPointsReport();
    } catch (err) {
      setError("Failed to download points report");
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
      return nameMatch && designationMatch;
    });
  }, [caByTypeData, filter, selectedDesignation]);

  const sortedAndFilteredAssociatesData = useMemo(() => {
    return filteredAssociatesData.sort((a, b) => {
      if (sortField === "name") {
        return sortOrder === "asc"
          ? a.info.name.localeCompare(b.info.name)
          : b.info.name.localeCompare(a.info.name);
      } else if (sortField === "points") {
        return sortOrder === "asc"
          ? a.info.points - b.info.points
          : b.info.points - a.info.points;
      } else if (sortField === "notificationLevel") {
        return sortOrder === "asc"
          ? a.info.notificationLevel.localeCompare(b.info.notificationLevel)
          : b.info.notificationLevel.localeCompare(a.info.notificationLevel);
      }
      return 0;
    });
  }, [filteredAssociatesData, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return (
        <ArrowUpDown
          className={`inline ml-1 h-4 w-4 ${
            sortOrder === "desc" ? "transform rotate-180" : ""
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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 font-bold text-sm">
              <div
                className="cursor-pointer p-2 rounded group hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
                onClick={() => handleSort("name")}
              >
                <span>Name</span> {renderSortIcon("name")}
              </div>
              <div
                className="cursor-pointer p-2 rounded group hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
                onClick={() => handleSort("points")}
              >
                <span>Points</span> {renderSortIcon("points")}
              </div>
              <div
                className="cursor-pointer p-2 rounded group hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out"
                onClick={() => handleSort("notificationLevel")}
              >
                <span>Notification Level</span>{" "}
                {renderSortIcon("notificationLevel")}
              </div>
              <div className="p-2">Actions</div>
            </div>
            <ul className="space-y-4">
              {sortedAndFilteredAssociatesData.length > 0 ? (
                sortedAndFilteredAssociatesData.map((associate) => (
                  <OccurrenceByTypeRow
                    key={associate.info.id}
                    associateInfo={associate.info}
                    occurrences={associate.occurrences}
                    occurrenceTypes={occurrenceTypes}
                    onDeleteOccurrence={handleDeleteOccurrence}
                    onUpdateOccurrence={handleUpdateOccurrence}
                    allowEdit={false}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No associates found with occurrences.</p>
              )}
            </ul>
          </div>
        );
      case "ca":
        return (
          <ul className="space-y-4">
            {filteredCAByTypeData.map((associate) => (
              <CAByTypeRow
                key={associate.id}
                associate={associate}
                associateInfo={associate.info}
                rules={rules}
              />
            ))}
          </ul>
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

          <RadioGroup
            value={selectedDesignation}
            onValueChange={(value) =>
              setSelectedDesignation(value as Designation | "ALL")
            }
            className="flex flex-wrap gap-3 mb-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ALL" id="all" />
              <Label htmlFor="all" className="text-sm">All</Label>
            </div>
            {Object.values(Designation).map((designation) => (
              <div key={designation} className="flex items-center space-x-2">
                <RadioGroupItem value={designation} id={designation} />
                <Label htmlFor={designation} className="text-sm">{designation}</Label>
              </div>
            ))}
          </RadioGroup>
          {error && <p className="text-destructive mt-2 mb-4 text-sm">{error}</p>}
        </div>
      </header>
      <main className="flex-grow overflow-y-auto p-4 sm:p-6">
        <div className="container mx-auto">{renderActiveReport()}</div>
      </main>
    </div>
  );
};

export default ReportsPage;
