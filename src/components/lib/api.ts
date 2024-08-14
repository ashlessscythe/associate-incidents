import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

export interface Associate {
  id: string;
  name: string;
  currentPoints: number;
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
