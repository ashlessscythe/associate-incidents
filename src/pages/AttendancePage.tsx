import { useEffect, useState } from "react";
import {
  Associate,
  OccurrenceType,
  Occurrence,
  getAssociates,
  getOccurrences,
  getOccurrenceTypes,
  addOccurrence,
} from "@/components/lib/api";
import AssociateSelect from "@/components/AssociateSelect";
import OccurrenceForm from "@/pages/OccurrenceForm";
import OccurrenceList from "@/pages/OccurrenceList";

function AttendancePage() {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [occurrenceTypes, setOccurrenceTypes] = useState<OccurrenceType[]>([]);
  const [selectedAssociateId, setSelectedAssociateId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        await fetchOccurrences();
        // Refresh associate data to update current points and notification
        const updatedAssociates = await getAssociates();
        setAssociates(updatedAssociates);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "An unknown error occurred");
      }
    }
  };

  const handleDelete = (occurrenceId: string) => {
    setOccurrences(
      occurrences.filter((occurrence) => occurrence.id !== occurrenceId)
    );
  };

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
        <OccurrenceForm
          occurrenceTypes={occurrenceTypes}
          associateId={selectedAssociateId}
          onAddOccurrence={handleAddOccurrence}
        />
        <OccurrenceList
          occurrences={occurrences}
          onDelete={handleDelete}
          associateId={selectedAssociateId}
        />
      </main>
    </div>
  );
}

export default AttendancePage;
