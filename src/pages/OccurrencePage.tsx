import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  OccurrenceType,
  Occurrence,
  getOccurrences,
  getOccurrenceTypes,
  addOccurrence,
  getAssociatePointsAndNotification,
  AssociateInfo,
  NotificationType,
  Designation,
} from "@/lib/api";
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import AssociateSelect from "@/components/AssociateSelect";
import OccurrenceForm from "@/components/form/OccurrenceForm";
import OccurrenceList from "@/components/list/OccurrenceList";
import { useAssociatesWithDesignation } from "@/hooks/useAssociates";
import { NotificationTracker } from "@/components/NotificationTracker";

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
    (user && Array.isArray(user.roles) && user.roles.includes("att-edit")) ||
    false;

  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const associateId = searchParams.get("associateId");
    if (associateId) {
      setSelectedAssociateId(associateId);
    }
  }, [location]);

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
    <div className="flex flex-col md:flex-row h-full">
      {/* Sidebar */}
      <div className="w-full md:w-2/5 lg:w-1/3 xl:w-1/4 p-4 md:h-full overflow-y-auto">
        <div className="sticky top-4 z-10 bg-white dark:bg-gray-800 p-4 shadow-md rounded-lg space-y-4">
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

      {/* Main content area */}
      <div className="flex-grow p-4 md:h-full overflow-y-auto">
        {!hasEditorRole && (
          <div
            className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-lg"
            role="alert"
          >
            <p className="font-bold">View Only Mode</p>
            <p>You do not have permission to add or edit occurrences.</p>
          </div>
        )}

        {/* OccurrenceList rendered if associateInfo is available */}
        {associateInfo && (
          <OccurrenceList
            associateInfo={associateInfo}
            occurrences={occurrences}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            occurrenceTypes={occurrenceTypes}
            allowEdit={hasEditorRole} // Pass the allowEdit prop
          />
        )}

        {/* Add NotificationTracker */}
        {selectedAssociateId && associateInfo && (
          <NotificationTracker
            associateId={selectedAssociateId}
            associateDesignation={associateInfo.designation as Designation}
            associateName={associateInfo.name}
            notificationType={NotificationType.OCCURRENCE}
          />
        )}
      </div>
    </div>
  );
}

export default OccurrencePage;
