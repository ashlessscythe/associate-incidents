import api from "./apiConfig";
import { OccurrenceType, Occurrence } from "./types";

export const getOccurrenceTypes = async (): Promise<OccurrenceType[]> => {
  const response = await api.get<OccurrenceType[]>("/occurrence-types");
  return response.data;
};

export const getOccurrences = async (associateId: string): Promise<Occurrence[]> => {
  const response = await api.get<Occurrence[]>(`/attendance-occurrences/${associateId}`);
  return response.data;
};

export const addOccurrence = async (occurrenceData: {
  associateId: string;
  typeId: string;
  date: Date;
  notes: string;
}): Promise<Occurrence> => {
  const response = await api.post<Occurrence>("/attendance-occurrences", occurrenceData);
  return response.data;
};

export const updateOccurrence = async (
  occurrenceId: string,
  occurrenceData: {
    typeId?: string;
    date?: Date;
    notes?: string;
  }
): Promise<Occurrence> => {
  try {
    const response = await api.put<Occurrence>(`/attendance-occurrences/${occurrenceId}`, occurrenceData);
    return response.data;
  } catch (error) {
    console.error("Error updating occurrence:", error);
    throw error;
  }
};

export const deleteOccurrence = async (occurrenceId: string): Promise<void> => {
  const res = await api.delete(`/attendance-occurrences/${occurrenceId}`);
  return res.data;
};