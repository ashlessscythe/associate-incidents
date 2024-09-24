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
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex-grow flex flex-col lg:flex-row">
        {/* Sticky element for both mobile and desktop */}
        <div className="w-full lg:w-1/3 xl:w-1/4 p-4 lg:overflow-y-auto">
          <div className="sticky top-0 lg:top-4 z-10 bg-gray-100 dark:bg-gray-900 p-4 shadow-md">
            <AssociateSelect
              selectedAssociateId={selectedAssociateId}
              onAssociateSelect={handleAssociateSelect}
            />
            {hasEditorRole && (
              <OccurrenceForm
                occurrenceTypes={occurrenceTypes}
                associateId={selectedAssociateId}
                onAddOccurrence={handleAddOccurrence}
              />
            )}
          </div>
        </div>
        <div className="lg:w-2/3 xl:w-3/4 p-4 overflow-y-auto">
          {!hasEditorRole && (
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
        </div>
      </div>
    </div>
  );
}

export default OccurrencePage;
