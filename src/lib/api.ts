import axios, { AxiosInstance } from "axios";

// Updated symbol pool to avoid URL-encoding issues
const symbols = "!$*_";
const hashSalt = import.meta.env.VITE_HASH_SALT;

if (!hashSalt) {
  throw new Error("HASH_SALT is not defined in .env file");
} else {
  console.log(`api.ts: hash is ${hashSalt.length} chars`);
}

// Function to generate API key
export async function generateApiKey(): Promise<string> {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01345678";
  let result = "";

  // Generate 14 random alphanumeric characters
  const randomValues = new Uint8Array(14);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < 14; i++) {
    result += characters[randomValues[i] % characters.length];
  }

  // Add one random symbol from the safe pool
  const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];

  // Insert the symbol at a random position in the string
  const insertPosition = Math.floor(Math.random() * result.length);
  result =
    result.slice(0, insertPosition) +
    randomSymbol +
    result.slice(insertPosition);

  // Generate time-based hash
  const timeHash = await generateTimeHash();

  // Combine API key with time hash
  return `${result}-${timeHash}`;
}

async function generateTimeHash(): Promise<string> {
  const now = new Date();
  const dateString = now.toISOString().split("T")[0];
  const hour = now.getUTCHours().toString().padStart(2, "0");
  // removing minute (a bit too agressive)
  // const minute = now.getUTCMinutes().toString().padStart(2, "0");

  const timeString = `${dateString}${hour}`;

  // Create hash using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(timeString + hashSalt);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Return first 8 characters of the hash
  return hashHex.substring(0, 8);
}

const api: AxiosInstance = axios.create({
  baseURL: "/zapi",
});

// Function to get and cache the API key
let cachedApiKey: string | null = null;
let lastGeneratedTime: number = 0;
const API_KEY_LIFETIME = 60000; // 1 minute in milliseconds

async function getApiKey(): Promise<string> {
  const now = Date.now();
  if (!cachedApiKey || now - lastGeneratedTime > API_KEY_LIFETIME) {
    cachedApiKey = await generateApiKey();
    lastGeneratedTime = now;
  }
  return cachedApiKey;
}

// Add a request interceptor
api.interceptors.request.use(
  async (config) => {
    const apiKey = await getApiKey();
    // Modify the url to include the API key
    config.url = `/${apiKey}${config.url}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Attendance stuff

export interface Associate {
  id: string;
  name: string;
  currentPoints?: number;
  correctiveAction?: CorrectiveAction[];
  occurrences?: Occurrence[];
}

export interface OccurrenceType {
  id: string;
  code: string;
  description: string;
  points: number;
}

export interface Occurrence {
  id: string;
  typeId?: string;
  type: OccurrenceType;
  date: Date;
  pointsAtTime: number;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

// Associate stuffs
export const getAssociates = async (): Promise<Associate[]> => {
  const response = await api.get<Associate[]>("/associates");
  return response.data;
};

// get associate by id
export const getAssociateById = async (
  id: string
): Promise<Associate | null> => {
  const response = await api.get<Associate>(`/associates/${id}`);
  return response.data;
};

// add associate
export async function addAssociate(name: string, currentPoints: number = 0) {
  const res = await api.post<Associate>("/associates", { name, currentPoints });
  return res.data;
}

// delete associate
export const deleteAssociate = async (id: string): Promise<void> => {
  const res = await api.delete(`/associates/${id}`);
  return res.data;
};

// occurence stuffs
export const getOccurrenceTypes = async (): Promise<OccurrenceType[]> => {
  const response = await api.get<OccurrenceType[]>("/occurrence-types");
  return response.data;
};

export const getOccurrences = async (
  associateId: string
): Promise<Occurrence[]> => {
  const response = await api.get<Occurrence[]>(
    `/attendance-occurrences/${associateId}`
  );
  return response.data;
};

export const addOccurrence = async (occurrenceData: {
  associateId: string;
  typeId: string;
  date: Date;
  notes: string;
}): Promise<Occurrence> => {
  const response = await api.post<Occurrence>(
    "/attendance-occurrences",
    occurrenceData
  );
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
    const response = await api.put<Occurrence>(
      `/attendance-occurrences/${occurrenceId}`,
      occurrenceData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating occurrence:", error);
    throw error; // Re-throw the error for the calling function to handle
  }
};

// delete occurrence by id
export const deleteOccurrence = async (occurrenceId: string): Promise<void> => {
  const res = await api.delete(`/attendance-occurrences/${occurrenceId}`);
  return res.data;
};

export const updateAssociatePoints = async (
  associateId: string
): Promise<Associate> => {
  const response = await api.put<Associate>(
    `/associates/${associateId}/update-points`
  );
  return response.data;
};

export interface AssociateInfo {
  id: string;
  name: string;
  points: number;
  notificationLevel: string;
  designation: string;
}

export interface AssociateAndDesignation {
  id: string;
  name: string;
  designation: string;
}

export interface AssociateAndOccurrences {
  id: string;
  name: string;
  occurrences: Occurrence[];
  info: AssociateInfo;
}

export const getAssociatePointsAndNotification = async (
  associateId: string
): Promise<AssociateInfo> => {
  try {
    const response = await api.get<AssociateInfo>(
      `/associates/${associateId}/points-and-notification`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching points and notification level:", error);
    throw error; // Rethrow the error to handle it in the useEffect
  }
};

export const getAssociatesAndDesignation = async (): Promise<
  AssociateAndDesignation[]
> => {
  try {
    const response = await api.get<AssociateAndDesignation[]>(
      "/associates-with-designation"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching associates with designation:", error);
    throw error; // Rethrow the error to handle it in the useEffect
  }
};

export const getAllAssociatesWithOccurrences = async (): Promise<
  AssociateAndOccurrences[]
> => {
  try {
    const response = await api.get<AssociateAndOccurrences[]>(
      "/all-with-occurrences"
    ); // Ensure the path matches server.js
    // console.log(`data: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching all associates with occurrences:", error);
    throw error; // Rethrow the error to handle it in the useEffect
  }
};

// Corrective Actions stuff

export type Rule = {
  id: string;
  code: string;
  description: string;
  type: RuleType;
};

export enum RuleType {
  SAFETY = "SAFETY",
  WORK = "WORK",
}

export type CorrectiveAction = {
  id: string;
  associateId: string;
  ruleId: string;
  rule: Rule[];
  level: number;
  description: string;
  date: Date;
};

export async function getRules(): Promise<Rule[]> {
  const res = await api.get<Rule[]>("/rules");
  return res.data;
}

export async function getCorrectiveActions(
  associateId: string
): Promise<CorrectiveAction[]> {
  if (!associateId) {
    return []; // Return an empty array if no associate is selected
  }
  try {
    const res = await api.get<CorrectiveAction[]>(
      `/corrective-actions/${associateId}`
    );
    // Ensure the response is an array
    if (Array.isArray(res.data)) {
      return res.data;
    } else {
      console.error(
        "Expected an array of CorrectiveActions, but got:",
        res.data
      );
      return [];
    }
  } catch (error) {
    console.error("Error fetching corrective actions:", error);
    return [];
  }
}

export async function addCorrectiveAction(data: {
  associateId: string;
  ruleId: string;
  description: string;
  level: number;
  date: Date;
}): Promise<CorrectiveAction> {
  const res = await api.post<CorrectiveAction>("/corrective-actions", data);
  return res.data;
}

// update
export const updateCorrectiveAction = async (
  id: string,
  data: {
    ruleId: string;
    description: string;
    level: number;
    date: Date;
  }
) => {
  const response = await api.put(`/corrective-actions/${id}`, data);
  return response.data;
};

// delete
export const deleteCorrectiveAction = async (id: string): Promise<void> => {
  await api.delete(`/corrective-actions/${id}`);
};

export async function getAssociatesData(months: number = 12) {
  try {
    const res = await api.get(`/associates-data?months=${months}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching associates data:", err);
    return [];
  }
}

export async function getCAByTypeWithAssociateInfo(months: number = 12) {
  try {
    const res = await api.get(`/ca-by-type-with-info?months=${months}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching CA by type data with associate info:", err);
    throw err;
  }
}

export async function getCAByType(months: number = 12) {
  try {
    const res = await api.get(`/ca-by-type?months=${months}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching CA by type data:", err);
    return [];
  }
}

// get template
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

export interface ExportOccRecord {
  id: string;
  associateId: string;
  exportedBy: string;
  exportedAt: Date;
  location: string;
  department: string;
}

// Excel export
export async function exportExcelOcc(
  associateName: string,
  location: string,
  department: string,
  date: string,
  occurrences: Occurrence[],
  notificationLevel: string
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
      },
      {
        responseType: "blob", // Important: This tells axios to handle the response as a Blob
      }
    );

    return response.data; // axios stores the blob in response.data when responseType is 'blob'
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

// Excel export for Corrective Actions (CA)
export async function exportExcelCA(
  associateName: string,
  location: string,
  department: string,
  date: string,
  correctiveActions: CorrectiveAction[], // Use CorrectiveAction type
  notificationLevel: string
): Promise<Blob> {
  try {
    const tempalteBlob = await getTemplate("ca");
    const response = await api.post(
      "/export-excel-ca",
      {
        tempalteBlob,
        associateName,
        location,
        department,
        date,
        correctiveActions,
        notificationLevel,
      },
      {
        responseType: "blob", // Important: This tells axios to handle the response as a Blob
      }
    );

    return response.data; // axios stores the blob in response.data when responseType is 'blob'
  } catch (error) {
    console.error("Error exporting Corrective Actions to Excel:", error);
    throw error;
  }
}
