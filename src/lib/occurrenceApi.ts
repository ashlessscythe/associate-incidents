import api from "./apiConfig";
import { OccurrenceType, Occurrence } from "./types";

// Function to upload a file for an occurrence
export const uploadOccurrenceFile = async (
  occurrenceId: string,
  file: File
): Promise<void> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("attendanceOccurrenceId", occurrenceId);

    const response = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("Upload response:", response.data);
  } catch (error) {
    console.error("Error uploading file for occurrence:", error);
    throw error;
  }
};

export const getOccurrenceTypes = async (): Promise<OccurrenceType[]> => {
  try {
    const response = await api.get<OccurrenceType[]>("/occurrence-types");
    return response.data;
  } catch (error) {
    console.error("Error fetching occurrence types:", error);
    throw error;
  }
};

export const getOccurrences = async (
  associateId: string
): Promise<Occurrence[]> => {
  try {
    const response = await api.get<Occurrence[]>(
      `/attendance-occurrences/${associateId}`
    );
    // Check if files are included in the response
    if (response.data.length > 0) {
      console.log("First occurrence files:", response.data[0].files);
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching occurrences:", error);
    throw error;
  }
};

export const addOccurrence = async (occurrenceData: {
  associateId: string;
  typeId: string;
  date: Date;
  notes: string;
}): Promise<Occurrence> => {
  try {
    const response = await api.post<Occurrence>(
      "/attendance-occurrences",
      occurrenceData
    );
    return response.data;
  } catch (error) {
    console.error("Error adding occurrence:", error);
    throw error;
  }
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
    const response = await api.put<Occurrence>(
      `/attendance-occurrences/${occurrenceId}`,
      occurrenceData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating occurrence:", error);
    throw error;
  }
};

export const deleteOccurrence = async (occurrenceId: string): Promise<void> => {
  try {
    const response = await api.delete(
      `/attendance-occurrences/${occurrenceId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting occurrence:", error);
    throw error;
  }
};
