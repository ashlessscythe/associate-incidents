import { useEffect, useState } from "react";
import {
  Associate,
  AssociateInfo,
  OccurrenceType,
  Occurrence,
  getAssociates,
  getOccurrences,
  getOccurrenceTypes,
  addOccurrence,
  getAssociatePointsAndNotification,
} from "@/lib/api";
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import AssociateSelect from "@/components/AssociateSelect";
import OccurrenceForm from "@/pages/OccurrenceForm";
import OccurrenceList from "@/pages/OccurrenceList";

function OccurrencePage() {
  const { user } = useAuthorizer();
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [occurrenceTypes, setOccurrenceTypes] = useState<OccurrenceType[]>([]);
  const [selectedAssociateId, setSelectedAssociateId] = useState<string | null>(
    null
  );
  const [_, setSelectedAssociate] = useState<AssociateInfo | null>(null);
  const [associateInfo, setAssociateInfo] = useState<AssociateInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasEditorRole =
    user && Array.isArray(user.roles) && user.roles.includes("att-edit");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [associatesData, typesData] = await Promise.all([
          getAssociates(),
          getOccurrenceTypes(),
        ]);
        setAssociates(associatesData);
        setOccurrenceTypes(typesData);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    fetchOccurrences();
    fetchInfo(selectedAssociateId);
  }, [selectedAssociateId]);

  const fetchOccurrences = async () => {
    if (selectedAssociateId) {
      try {
        const occurrencesData = await getOccurrences(selectedAssociateId);
        setOccurrences(occurrencesData);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    } else {
      setOccurrences([]);
    }
  };

  const fetchInfo = async (id: string | null) => {
    if (id) {
      try {
        const associateInfoData = await getAssociatePointsAndNotification(id);
        setAssociateInfo(associateInfoData);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    } else {
      setAssociateInfo(null);
    }
  };

  const handleAssociateSelect = async (associateId: string | null) => {
    setSelectedAssociateId(associateId);
    if (associateId) {
      const associate = await getAssociatePointsAndNotification(associateId);
      setSelectedAssociate(associate);
    } else {
      setSelectedAssociate(null);
    }
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
        await fetchOccurrences();
        // Refresh associate data to update current points and notification
        const updatedAssociates = await getAssociates();
        setAssociates(updatedAssociates);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "An unknown error occurred");
      }
    }
  };

  const handleUpdate = async (associateId: string) => {
    const updatedOccurrences = await getOccurrences(associateId);
    setOccurrences(updatedOccurrences);
  };

  const handleDelete = (occurrenceId: string) => {
    setOccurrences(
      occurrences.filter((occurrence) => occurrence.id !== occurrenceId)
    );
  };

  function isAssociateInfo(info: AssociateInfo | null): info is AssociateInfo {
    return info !== null;
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <main className="container mx-auto p-4 max-w-[95%]">
        <AssociateSelect
          associates={associates}
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
        {isAssociateInfo(associateInfo) && (
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
