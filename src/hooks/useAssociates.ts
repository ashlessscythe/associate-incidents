import { useState, useEffect, useCallback } from "react";
import {
  Associate,
  AssociateAndInfo,
  getAllAssociatesWithOccurrences,
} from "@/lib/api";

export enum Designation {
  NONE = "NONE",
  MH = "MH",
  CLERK = "CLERK",
}

export function useAssociates() {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [associatesWithInfo, setAssociatesWithInfo] = useState<
    AssociateAndInfo[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssociates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllAssociatesWithOccurrences();

      const formattedAssociates: AssociateAndInfo[] = data.map((associate) => ({
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
      setAssociates(
        formattedAssociates.map(({ id, name, occurrences }) => ({
          id,
          name,
          occurrences,
        }))
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssociates();
  }, [fetchAssociates]);

  return {
    associates,
    associatesWithInfo,
    loading,
    error,
    refreshAssociates: fetchAssociates,
  };
}
