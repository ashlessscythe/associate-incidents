import { useState, useEffect, useRef, useCallback } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import AssociateSelect from "@/components/AssociateSelect";
import OccurrenceForm from "@/components/form/OccurrenceForm";
import OccurrenceList from "@/components/list/OccurrenceList";
import { useAssociatesWithDesignation } from "@/hooks/useAssociates";
import { NotificationTracker } from "@/components/NotificationTracker";
import ModuleWorkspace from "@/components/layout/ModuleWorkspace";
import { AlertTriangle } from "lucide-react";

function OccurrencePage() {
  const { user } = useAuth();
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
  const associateFetchSeq = useRef(0);

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

  const fetchOccurrences = useCallback(async (associateId: string, seq: number) => {
    try {
      const occurrencesData = await getOccurrences(associateId);
      if (seq !== associateFetchSeq.current) {
        return;
      }
      setOccurrences(occurrencesData);
    } catch (err: unknown) {
      if (seq !== associateFetchSeq.current) {
        return;
      }
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  }, []);

  const fetchAssociateInfo = useCallback(async (associateId: string, seq: number) => {
    try {
      const associateInfoData = await getAssociatePointsAndNotification(
        associateId
      );
      if (seq !== associateFetchSeq.current) {
        return;
      }
      setAssociateInfo(associateInfoData);
    } catch (err: unknown) {
      if (seq !== associateFetchSeq.current) {
        return;
      }
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  }, []);

  useEffect(() => {
    if (selectedAssociateId) {
      const seq = ++associateFetchSeq.current;
      setAssociateInfo(null);
      setOccurrences([]);
      fetchOccurrences(selectedAssociateId, seq);
      fetchAssociateInfo(selectedAssociateId, seq);
    } else {
      associateFetchSeq.current += 1;
      setOccurrences([]);
      setAssociateInfo(null);
    }
  }, [selectedAssociateId, fetchOccurrences, fetchAssociateInfo]);

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
        const seq = associateFetchSeq.current;
        await fetchOccurrences(selectedAssociateId, seq);
        await fetchAssociateInfo(selectedAssociateId, seq);
        await fetchAssociatesWithDesignation();
      } catch (e: unknown) {
        throw e instanceof Error ? e : new Error("An unknown error occurred");
      }
    }
  };

  const handleUpdate = async (associateId: string) => {
    const seq = associateFetchSeq.current;
    await fetchOccurrences(associateId, seq);
    await fetchAssociateInfo(associateId, seq);
  };

  const handleDelete = async (occurrenceId: string) => {
    setOccurrences((prev) =>
      prev.filter((occurrence) => occurrence.id !== occurrenceId)
    );
    if (selectedAssociateId) {
      const seq = associateFetchSeq.current;
      await fetchAssociateInfo(selectedAssociateId, seq);
    }
  };

  if (associatesLoading || loading) return <div className="p-4">Loading...</div>;
  if (associatesError || error)
    return <div className="p-4">Error: {associatesError || error}</div>;

  return (
    <ModuleWorkspace
      select={
        <AssociateSelect
          selectedAssociateId={selectedAssociateId}
          onAssociateSelect={handleAssociateSelect}
        />
      }
      canAdd={hasEditorRole}
      addLabel="Add occurrence"
      formTitle="Add occurrence"
      formDescription="Create a new attendance occurrence for the selected associate."
      hasSelection={Boolean(selectedAssociateId)}
      emptyMessage="Select an associate to view attendance occurrences."
      form={
        hasEditorRole
          ? ({ closeForm }) => (
              <OccurrenceForm
                occurrenceTypes={occurrenceTypes}
                associateId={selectedAssociateId}
                onAddOccurrence={async (data) => {
                  await handleAddOccurrence(data);
                  closeForm();
                }}
              />
            )
          : undefined
      }
    >
      {!hasEditorRole && (
        <div
          className="bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-200 p-4 mb-4 rounded-lg"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm sm:text-base">View Only Mode</p>
              <p className="text-sm">
                You do not have permission to add or edit occurrences.
              </p>
            </div>
          </div>
        </div>
      )}

      {associateInfo && (
        <OccurrenceList
          key={associateInfo.id}
          associateInfo={associateInfo}
          occurrences={occurrences}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          occurrenceTypes={occurrenceTypes}
          allowEdit={hasEditorRole}
        />
      )}

      {selectedAssociateId && associateInfo && (
        <NotificationTracker
          associateId={selectedAssociateId}
          associateDesignation={associateInfo.designation as Designation}
          associateName={associateInfo.name}
          notificationType={NotificationType.OCCURRENCE}
        />
      )}
    </ModuleWorkspace>
  );
}

export default OccurrencePage;
