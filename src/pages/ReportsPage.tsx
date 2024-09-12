import React, { useEffect, useState } from "react";
import {
  getCAByType,
  getRules,
  getAssociates,
  getOccurrences,
  getOccurrenceTypes,
  getAssociatePointsAndNotification,
} from "../lib/api";
import { Button } from "@/components/ui/button";
import OccurrenceByTypeRow from "@/components/OccurrenceByTypeRow";
import CAByTypeRow from "@/components/CAByTypeRow";
import {
  Associate,
  AssociateInfo,
  Occurrence,
  OccurrenceType,
  CorrectiveAction,
  Rule,
} from "../lib/api";

interface CAByTypeData {
  id: string;
  name: string;
  correctiveActions: CorrectiveAction[];
}

const ReportsPage: React.FC = () => {
  const [caByTypeData, setCAByTypeData] = useState<CAByTypeData[]>([]);
  const [occurrencesByAssociate, setOccurrencesByAssociate] = useState<
    {
      associate: Associate;
      occurrences: Occurrence[];
      associateInfo: AssociateInfo;
    }[]
  >([]);
  const [occurrenceTypes, setOccurrenceTypes] = useState<OccurrenceType[]>([]);
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<"occurrences" | "ca" | null>(
    null
  );

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [rulesData, occurrenceTypesData, associates] = await Promise.all([
          getRules(),
          getOccurrenceTypes(),
          getAssociates(),
        ]);
        setRules(rulesData);
        setOccurrenceTypes(occurrenceTypesData);
        setAssociates(associates);
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError("Failed to fetch initial data");
      }
    };
    fetchInitialData();
  }, []);

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

  const handleFetchOccurrencesByAssociate = async () => {
    setLoading(true);
    setError(null);
    try {
      const occurrencesData = await Promise.all(
        associates.map(async (associate) => {
          const occurrences = await getOccurrences(associate.id);
          const associateInfo = await getAssociatePointsAndNotification(
            associate.id
          );
          return { associate, occurrences, associateInfo };
        })
      );
      console.log(`occurrencesData: ${occurrencesData.length}`);
      setOccurrencesByAssociate(occurrencesData);
      setActiveReport("occurrences");
    } catch (err) {
      setError("Failed to fetch occurrences by associate data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearReport = () => {
    setCAByTypeData([]);
    setAssociates([]);
    setActiveReport(null);
    setError(null);
  };

  const handleEditCA = async (ca: CorrectiveAction) => {
    // Implement edit functionality
    console.log("Edit CA:", ca);
  };

  const handleDeleteCA = async (id: string) => {
    // Implement delete functionality
    console.log("Delete CA:", id);
  };

  const handleDeleteOccurrence = async (occurrenceId: string) => {
    // Implement delete functionality
    console.log("Delete Occurrence:", occurrenceId);
  };

  const handleUpdateOccurrence = async (associateId: string) => {
    // Implement update functionality
    console.log("Update Occurrences for Associate:", associateId);
  };

  const renderActiveReport = () => {
    console.log(`active report ${activeReport}`);

    switch (activeReport) {
      case "occurrences":
        return (
          <ul className="space-y-4">
            {occurrencesByAssociate.map(
              ({ associate, occurrences, associateInfo }) => (
                <OccurrenceByTypeRow
                  key={associate.id}
                  associate={associate}
                  associateInfo={associateInfo}
                  occurrences={occurrences}
                  occurrenceTypes={occurrenceTypes}
                  onDeleteOccurrence={handleDeleteOccurrence}
                  onUpdateOccurrence={handleUpdateOccurrence}
                />
              )
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
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      <div className="flex justify-start space-x-4 mb-4">
        <Button onClick={handleFetchOccurrencesByAssociate} disabled={loading}>
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
