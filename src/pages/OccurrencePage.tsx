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
import { AlertTriangle, PanelLeftClose, PanelLeftOpen } from "lucide-react";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
        setError(e instanceof Error ? e.message : "An unknown error occurred");
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (associatesLoading || loading) return <div className="p-4">Loading...</div>;
  if (associatesError || error)
    return <div className="p-4">Error: {associatesError || error}</div>;

  return (
    <div className="flex flex-col lg:flex-row h-full relative bg-background text-foreground">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "w-full lg:w-1/2 xl:w-2/5 2xl:w-1/3" : "w-0"
        } transition-all duration-300 ease-in-out overflow-hidden lg:h-full bg-card text-card-foreground shadow-md`}
      >
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
      </div>

      {/* Toggle button - positioned at the top of the main content area */}
      <div className="relative">
        <button
          onClick={toggleSidebar}
          className={`absolute top-4 z-20 bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-md shadow-md transition-all duration-300 ease-in-out ${
            isSidebarOpen 
              ? "left-4 lg:left-0 lg:-translate-x-1/2" 
              : "left-4"
          }`}
          title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Main content area */}
      <div
        className={`flex-grow p-4 lg:h-full overflow-y-auto transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "lg:ml-4" : "lg:ml-0"
        }`}
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
                <p className="text-sm">You do not have permission to add or edit occurrences.</p>
              </div>
            </div>
          </div>
        )}

        {/* OccurrenceList rendered if associateInfo is available */}
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
