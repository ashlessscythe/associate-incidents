import React, { useEffect, useState } from "react";
import {
  getCAByType,
  getRules,
  getOccurrenceTypes,
  getAllAssociatesWithOccurrences,
  AssociateAndInfo,
} from "../lib/api";
import { Button } from "@/components/ui/button";
import OccurrenceByTypeRow from "@/components/OccurrenceByTypeRow";
import CAByTypeRow from "@/components/CAByTypeRow";
import { OccurrenceType, CorrectiveAction, Rule } from "../lib/api";

interface CAByTypeData {
  id: string;
  name: string;
  correctiveActions: CorrectiveAction[];
}

const ReportsPage: React.FC = () => {
  const [caByTypeData, setCAByTypeData] = useState<CAByTypeData[]>([]);
  const [occurrenceTypes, setOccurrenceTypes] = useState<OccurrenceType[]>([]);
  const [associatesData, setAssociatesData] = useState<AssociateAndInfo[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<"occurrences" | "ca" | null>(
    null
  );

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
      const associatesData: AssociateAndInfo[] =
        await getAllAssociatesWithOccurrences();
      setAssociatesData(associatesData);
      // console.log("full response: ", associatesData);
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
      const data = await getCAByType();
      setCAByTypeData(data);
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

  const renderActiveReport = () => {
    console.log(`active report ${activeReport}`);

    switch (activeReport) {
      case "occurrences":
        return (
          <ul className="space-y-4">
            {associatesData?.length > 0 ? (
              associatesData.map((associate) => (
                <OccurrenceByTypeRow
                  key={associate.info.id}
                  associateInfo={associate.info} // Accessing info field from associate
                  occurrences={associate.occurrences} // Accessing occurrences field from associate
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
            {caByTypeData.map((associate) => (
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
        return <p>Please select associate report to run.</p>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      <div className="flex justify-start space-x-4 mb-4">
        <Button onClick={handleGetAllOccurrences} disabled={loading}>
          {loading && activeReport === "occurrences"
            ? "Loading..."
            : "Run Occurrences by Associate Report"}
        </Button>
        <Button onClick={handleFetchCAByType} disabled={loading}>
          {loading && activeReport === "ca"
            ? "Loading..."
            : "Run CA by Type Report"}
        </Button>
        <Button onClick={handleClearReport} variant="outline">
          Clear Report
        </Button>
      </div>
      {error && <p className="text-red-500 mt-2 mb-4">{error}</p>}
      {renderActiveReport()}
    </div>
  );
};

export default ReportsPage;
