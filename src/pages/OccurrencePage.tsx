import { useState, useEffect } from "react";
import {
  OccurrenceType,
  Occurrence,
  getOccurrences,
  getOccurrenceTypes,
  addOccurrence,
  getAssociatePointsAndNotification,
  AssociateInfo,
} from "@/lib/api";
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import AssociateSelect from "@/components/AssociateSelect";
import OccurrenceForm from "@/pages/OccurrenceForm";
import OccurrenceList from "@/pages/OccurrenceList";
import { useAssociatesWithDesignation } from "@/hooks/useAssociates";

function OccurrencePage() {
  const { user } = useAuthorizer();
  const {
    fetchAssociatesWithDesignation,
    loading: associatesLoading,
    error: associatesError,
  } = useAssociatesWithDesignation();
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [occurrenceTypes, setOccurrenceTypes] = useState<OccurrenceType[]>([]);
  const [selectedAssociateId, setSelectedAssociateId] = useState<string | null>(
    null
  );
  const [associateInfo, setAssociateInfo] = useState<AssociateInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasEditorRole =
    user && Array.isArray(user.roles) && user.roles.includes("att-edit");

  useEffect(() => {
    const fetchOccurrenceTypes = async () => {
      try {
        const typesData = await getOccurrenceTypes();
        setOccurrenceTypes(typesData);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOccurrenceTypes();
  }, []);

  useEffect(() => {
    if (selectedAssociateId) {
      fetchOccurrences(selectedAssociateId);
      fetchAssociateInfo(selectedAssociateId);
    } else {
      setOccurrences([]);
      setAssociateInfo(null);
    }
  }, [selectedAssociateId]);

  const fetchOccurrences = async (associateId: string) => {
    try {
      const occurrencesData = await getOccurrences(associateId);
      setOccurrences(occurrencesData);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  const fetchAssociateInfo = async (associateId: string) => {
    try {
      const associateInfoData = await getAssociatePointsAndNotification(
        associateId
      );
      setAssociateInfo(associateInfoData);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  const handleAssociateSelect = (associateId: string | null) => {
    setSelectedAssociateId(associateId);
  };

  const handleAddOccurrence = async (occurrenceData: {
    typeId: string;
    date: Date;
    notes: string;
  }) => {
    if (selectedAssociateId) {
      try {
        await addOccurrence({
          ...occurrenceData,
          associateId: selectedAssociateId,
        });
        await fetchOccurrences(selectedAssociateId);
        await fetchAssociateInfo(selectedAssociateId);
        await fetchAssociatesWithDesignation();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "An unknown error occurred");
      }
    }
  };

  const handleUpdate = async (associateId: string) => {
    await fetchOccurrences(associateId);
    await fetchAssociateInfo(associateId);
  };

  const handleDelete = (occurrenceId: string) => {
    setOccurrences(
      occurrences.filter((occurrence) => occurrence.id !== occurrenceId)
    );
  };

  if (associatesLoading || loading) return <div>Loading...</div>;
  if (associatesError || error)
    return <div>Error: {associatesError || error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <main className="container mx-auto p-4 max-w-[95%]">
        <AssociateSelect
          selectedAssociateId={selectedAssociateId}
          onAssociateSelect={handleAssociateSelect}
        />
        {hasEditorRole ? (
          <OccurrenceForm
            occurrenceTypes={occurrenceTypes}
            associateId={selectedAssociateId}
            onAddOccurrence={handleAddOccurrence}
          />
        ) : (
          <div
            className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4"
            role="alert"
          >
            <p className="font-bold">View Only Mode</p>
            <p>You do not have permission to add or edit occurrences.</p>
          </div>
        )}
        {associateInfo && (
          <OccurrenceList
            associateInfo={associateInfo}
            occurrences={occurrences}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            occurrenceTypes={occurrenceTypes}
          />
        )}
      </main>
    </div>
  );
}

export default OccurrencePage;
