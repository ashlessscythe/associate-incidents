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
  typeId: string;
  type: OccurrenceType;
  date: Date;
  pointsAtTime: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
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

export async function addAssociate(name: string, currentPoints: number = 0) {
  const res = await api.post<Associate>("/associates", { name, currentPoints });
  return res.data;
}

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
  const response = await axios.put(`/api/corrective-actions/${id}`, data);
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

export async function getCAByType(months: number = 12) {
  try {
    const res = await api.get(`/ca-by-type?months=${months}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching CA by type data:", err);
    return [];
  }
}
