import api from "./apiConfig";
import { Associate, AssociateAndDesignation, AssociateInfo, AssociateAndOccurrences } from "./types";

export const getAssociates = async (): Promise<Associate[]> => {
  const response = await api.get<Associate[]>("/associates");
  return response.data;
};

export const getAssociateById = async (id: string): Promise<Associate | null> => {
  const response = await api.get<Associate>(`/associates/${id}`);
  return response.data;
};

export async function addAssociate(name: string, currentPoints: number = 0) {
  const res = await api.post<Associate>("/associates", { name, currentPoints });
  return res.data;
}

export const updateAssociate = async (
  id: string,
  name: string,
  departmentId: string,
  designation: string,
  locationId: string
): Promise<AssociateAndDesignation> => {
  const res = await api.put<AssociateAndDesignation>(`/associates/${id}`, {
    name,
    departmentId,
    designation,
    locationId,
  });
  return res.data;
};

export const deleteAssociate = async (id: string): Promise<void> => {
  const res = await api.delete(`/associates/${id}`);
  return res.data;
};

export const updateAssociatePoints = async (associateId: string): Promise<Associate> => {
  const response = await api.put<Associate>(`/associates/${associateId}/update-points`);
  return response.data;
};

export const getAssociatePointsAndNotification = async (associateId: string): Promise<AssociateInfo> => {
  try {
    const response = await api.get<AssociateInfo>(`/associates/${associateId}/points-and-notification`);
    return response.data;
  } catch (error) {
    console.error("Error fetching points and notification level:", error);
    throw error;
  }
};

export const getAssociatesAndDesignation = async (): Promise<AssociateAndDesignation[]> => {
  try {
    const response = await api.get<AssociateAndDesignation[]>("/associates-with-designation");
    return response.data;
  } catch (error) {
    console.error("Error fetching associates with designation:", error);
    throw error;
  }
};

export const getAllAssociatesWithOccurrences = async (): Promise<AssociateAndOccurrences[]> => {
  try {
    const response = await api.get<AssociateAndOccurrences[]>("/all-with-occurrences");
    return response.data;
  } catch (error) {
    console.error("Error fetching all associates with occurrences:", error);
    throw error;
  }
};