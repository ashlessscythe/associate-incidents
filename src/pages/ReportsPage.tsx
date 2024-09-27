import React, { useEffect, useState, useMemo } from "react";
import {
  getCAByTypeWithAssociateInfo,
  getRules,
  getOccurrenceTypes,
  getAllAssociatesWithOccurrences,
  AssociateAndOccurrences,
} from "../lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OccurrenceByTypeRow from "@/components/OccurrenceByTypeRow";
import CAByTypeRow from "@/components/CAByTypeRow";
import {
  AssociateInfo,
  OccurrenceType,
  CorrectiveAction,
  Rule,
} from "../lib/api";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Designation } from "@/hooks/useAssociates";

interface CAByTypeData {
  id: string;
  name: string;
  correctiveActions: CorrectiveAction[];
  info: AssociateInfo;
}

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
      // Fetch corrective actions by type with associate info in a single call
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

  const handleEditCA = async (ca: CorrectiveAction) => {
    console.log("Edit CA:", ca);
  };

  const handleDeleteCA = async (id: string) => {
    console.log("Delete CA:", id);
  };

  const handleDeleteOccurrence = async (occurrenceId: string) => {
    console.log("Delete Occurrence:", occurrenceId);
  };

  const handleUpdateOccurrence = async (associateId: string) => {
    console.log("Update Occurrences for Associate:", associateId);
  };

  const filteredAssociatesData = useMemo(() => {
    if (!filter) return associatesData;

    return associatesData.filter((associate) =>
      associate.info.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [associatesData, filter]);

  const filteredCAByTypeData = useMemo(() => {
    if (!filter) return caByTypeData;

    return caByTypeData.filter((associate) =>
      associate.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [caByTypeData, filter]);

  const renderActiveReport = () => {
    switch (activeReport) {
      case "occurrences":
        return (
          <ul className="space-y-4">
            {filteredAssociatesData?.length > 0 ? (
              filteredAssociatesData.map((associate) => (
                <OccurrenceByTypeRow
                  key={associate.info.id}
                  associateInfo={associate.info}
                  occurrences={associate.occurrences}
                  occurrenceTypes={occurrenceTypes}
                  onDeleteOccurrence={handleDeleteOccurrence}
                  onUpdateOccurrence={handleUpdateOccurrence}
                />
              ))
            ) : (
              <p>No associates found with occurrences.</p>
            )}
          </ul>
        );
      case "ca":
        return (
          <ul className="space-y-4">
            {filteredCAByTypeData.map((associate) => (
              <CAByTypeRow
                key={associate.id}
                associate={associate}
                rules={rules}
                onEditCA={handleEditCA}
                onDeleteCA={handleDeleteCA}
              />
            ))}
          </ul>
        );
      default:
        return <p>Please select a report to run.</p>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold mb-4">Reports</h1>
          <div className="flex flex-wrap gap-2 mb-4">
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
            {/* Filter input field */}
            <Input
              type="text"
              placeholder="Filter by Associate Name"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md dark:border-gray-600"
            />
          </div>
          <RadioGroup
            value={selectedDesignation}
            onValueChange={(value) =>
              setSelectedDesignation(value as Designation | "ALL")
            }
            className="flex flex-wrap gap-2 mb-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ALL" id="all" />
              <Label htmlFor="all">All</Label>
            </div>
            {Object.values(Designation).map((designation) => (
              <div key={designation} className="flex items-center space-x-2">
                <RadioGroupItem value={designation} id={designation} />
                <Label htmlFor={designation}>{designation}</Label>
              </div>
            ))}
          </RadioGroup>
          {error && <p className="text-red-500 mt-2 mb-4">{error}</p>}
        </div>
      </header>
      <main className="flex-grow overflow-y-auto p-4">
        <div className="container mx-auto">{renderActiveReport()}</div>
      </main>
    </div>
  );
};

export default ReportsPage;
