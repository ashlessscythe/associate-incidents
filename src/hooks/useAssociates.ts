import { useState, useCallback } from "react";
import {
  AssociateAndDesignation,
  AssociateAndOccurrences,
  getAllAssociatesWithOccurrences,
  getAssociatesAndDesignation,
} from "@/lib/api";

export enum Designation {
  NONE = "NONE",
  MH = "MH",
  CLERK = "CLERK",
}

// Hook to fetch associates with occurrences
export function useAssociatesWithOccurrences() {
  const [associatesWithInfo, setAssociatesWithInfo] = useState<AssociateAndOccurrences[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssociatesWithOccurrences = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllAssociatesWithOccurrences();

      const formattedAssociates: AssociateAndOccurrences[] = data.map((associate) => ({
        id: associate.id,
        name: associate.name,
        info: {
          id: associate.info.id,
          name: associate.info.name,
          points: associate.info.points,
          notificationLevel: associate.info.notificationLevel,
          designation: associate.info.designation as Designation,
        },
        occurrences: associate.occurrences,
      }));

      setAssociatesWithInfo(formattedAssociates);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    associatesWithInfo,
    loading,
    error,
    fetchAssociatesWithOccurrences,
  };
}

// Hook to fetch associates with designation
export function useAssociatesWithDesignation() {
  const [associatesWithDesignation, setAssociatesWithDesignation] = useState<AssociateAndDesignation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssociatesWithDesignation = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAssociatesAndDesignation();

      setAssociatesWithDesignation(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    associatesWithDesignation,
    loading,
    error,
    fetchAssociatesWithDesignation,
  };
}
