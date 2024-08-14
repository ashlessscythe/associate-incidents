import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Attendance stuff

export interface Associate {
  id: string;
  name: string;
  currentPoints: number;
  correctiveAction: CorrectiveAction;
}

export interface OccurrenceType {
  id: string;
  code: string;
  description: string;
  points: number;
}

export interface Occurrence {
  id: string;
  associateId: string;
  typeId: string;
  type: OccurrenceType;
  date: Date;
  pointsAtTime: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const getAssociates = async (): Promise<Associate[]> => {
  const response = await api.get<Associate[]>("/associates");
  return response.data;
};

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

// delete occurrence by id
export const deleteOccurrence = async (occurrenceId: string): Promise<void> => {
  // console.log("API deleteOccurrence: ", occurrenceId);
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

export const getAssociatePointsAndNotification = async (
  associateId: string
): Promise<{ points: number; notificationLevel: string }> => {
  const response = await axios.get(
    `/api/associates/${associateId}/points-and-notification`
  );
  return response.data;
};

// Corrective Actions stuff

export type Rule = {
  id: string;
  code: string;
  description: string;
  type: "SAFETY" | "WORK";
};

export type CorrectiveAction = {
  id: string;
  associateId: string;
  ruleId: string;
  rule: Rule;
  level: number;
  description: string;
  date: string;
};

export async function getRules(): Promise<Rule[]> {
  const response = await fetch("/api/rules");
  if (!response.ok) {
    throw new Error("Failed to fetch rules");
  }
  return response.json();
}

export async function getCorrectiveActions(
  associateId: string | null
): Promise<CorrectiveAction[]> {
  if (!associateId) {
    return []; // Return an empty array if no associate is selected
  }
  const response = await fetch(
    `/api/correctiveActions?associateId=${associateId}`
  );
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "Error fetching corrective actions:",
      response.status,
      errorText
    );
    throw new Error(
      `Failed to fetch corrective actions: ${response.status} ${errorText}`
    );
  }
  return response.json();
}

export async function addCorrectiveAction(data: {
  associateId: string;
  ruleId: string;
  description: string;
  level: number;
}): Promise<CorrectiveAction> {
  const response = await fetch("/api/correctiveActions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to add corrective action");
  }
  return response.json();
}
