import api from "./apiConfig";
import {
  Associate,
  AssociateAndDesignation,
  AssociateInfo,
  AssociateAndOccurrences,
} from "./types";

export const getAssociates = async (): Promise<Associate[]> => {
  const response = await api.get<Associate[]>("/associates");
  return response.data;
};

export const getAssociateById = async (
  id: string
): Promise<Associate | null> => {
  const response = await api.get<Associate>(`/associates/${id}`);
  return response.data;
};

export type AddAssociateInput = {
  name: string;
  currentPoints?: number;
  departmentId?: string;
  designation?: string;
  locationId?: string;
};

export async function addAssociate(input: AddAssociateInput | string) {
  const payload =
    typeof input === "string"
      ? { name: input, currentPoints: 0 }
      : {
          name: input.name,
          currentPoints: input.currentPoints ?? 0,
          departmentId: input.departmentId,
          designation: input.designation,
          locationId: input.locationId,
        };
  const res = await api.post<Associate>("/associates", payload);
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

export const setAssociatePointsAdjustment = async (
  associateId: string,
  pointsAdjustment: number
): Promise<{ id: string; name: string; pointsAdjustment: number }> => {
  const response = await api.put(
    `/associates/${associateId}/points-adjustment`,
    { pointsAdjustment }
  );
  return response.data;
};

export const setAssociatePointTotalsEffectiveDate = async (
  associateId: string,
  pointTotalsEffectiveDate: string | null
): Promise<{
  id: string;
  name: string;
  pointTotalsEffectiveDate: string | null;
}> => {
  const response = await api.put(
    `/associates/${associateId}/point-totals-effective-date`,
    { pointTotalsEffectiveDate }
  );
  return response.data;
};

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
    throw error;
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
    throw error;
  }
};

export const getAllAssociatesWithOccurrences = async (): Promise<
  AssociateAndOccurrences[]
> => {
  try {
    const response = await api.get<AssociateAndOccurrences[]>(
      "/all-with-occurrences"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching all associates with occurrences:", error);
    throw error;
  }
};

export const getDesignations = async (): Promise<string[]> => {
  try {
    const response = await api.get<string[]>("/designations");
    return response.data;
  } catch (error) {
    console.error("Error fetching designations:", error);
    throw error;
  }
};

export const toggleAssociateActive = async (
  id: string,
  currentState: boolean
): Promise<Associate> => {
  const response = await api.put<Associate>(
    `/associates/${id}/toggle-active`,
    { isActive: currentState }
  );
  return response.data;
};

export interface DesignationVisibility {
  designation: string;
  isVisible: boolean;
  pointTotalsEffectiveDate?: string | null;
}

export type DesignationVisibilityUpdate = {
  isVisible?: boolean;
  pointTotalsEffectiveDate?: string | null;
};

export const getDesignationVisibility = async (): Promise<DesignationVisibility[]> => {
  try {
    const response = await api.get<{ designations: DesignationVisibility[] }>(
      "/admin/designations"
    );
    return response.data.designations;
  } catch (error) {
    console.error("Error fetching designation visibility:", error);
    throw error;
  }
};

export const updateDesignationVisibility = async (
  designation: string,
  updates: DesignationVisibilityUpdate
): Promise<DesignationVisibility> => {
  try {
    const response = await api.patch<{ designation: DesignationVisibility }>(
      `/admin/designations/${designation}`,
      updates
    );
    return response.data.designation;
  } catch (error) {
    console.error("Error updating designation visibility:", error);
    throw error;
  }
};
