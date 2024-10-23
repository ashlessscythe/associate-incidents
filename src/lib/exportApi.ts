import axios from "axios";
import api from "./apiConfig";
import {
  Notification,
  ExportOccRecord,
  Occurrence,
  CorrectiveAction,
} from "./types";

const getTemplate = async (type: "ca" | "occurrence"): Promise<Blob | null> => {
  try {
    console.log(`Getting excel blob for ${type}`);
    const response = await axios.get(`/api/get-template/${type}`, {
      responseType: "blob",
    });

    if (response.status !== 200) {
      throw new Error("Failed to fetch template");
    }

    return new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    return null;
  }
};

export async function exportExcelOcc(
  associateName: string,
  location: string,
  department: string,
  date: string,
  occurrences: Occurrence[],
  notificationLevel: string,
  notifications: Notification[],
  designation: string
): Promise<Blob> {
  try {
    const templateBlob = await getTemplate("occurrence");
    const response = await api.post(
      "/export-excel-occurrence",
      {
        templateBlob,
        associateName,
        location,
        department,
        date,
        occurrences,
        notificationLevel,
        notifications,
        designation,
      },
      {
        responseType: "blob",
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error exporting Excel:", error);
    throw error;
  }
}

export const recordOccExport = async (
  associateId: string,
  exportedBy: string,
  exportedAt: Date,
  location: string,
  department: string
): Promise<ExportOccRecord> => {
  const response = await api.post("/record-occ-export", {
    associateId,
    exportedBy,
    exportedAt,
    location,
    department,
  });

  if (!response) {
    throw new Error("Failed to record occ export");
  }

  return response.data;
};

export const getExportOccRecords = async (
  associateId: string
): Promise<ExportOccRecord[]> => {
  const response = await api.get(`/export-occ-records/${associateId}`);

  if (!response) {
    throw new Error("Failed to fetch export occ records");
  }

  return response.data;
};

export async function exportExcelCA(
  associateName: string,
  location: string,
  department: string,
  date: string,
  correctiveActions: CorrectiveAction[],
  notificationLevel: string
): Promise<Blob> {
  try {
    const templateBlob = await getTemplate("ca");
    const response = await api.post(
      "/export-excel-ca",
      {
        templateBlob,
        associateName,
        location,
        department,
        date,
        correctiveActions,
        notificationLevel,
      },
      {
        responseType: "blob",
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error exporting Corrective Action to Excel:", error);
    throw error;
  }
}
