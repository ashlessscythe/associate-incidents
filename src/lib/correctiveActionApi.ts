import api from "./apiConfig";
import { Rule, CorrectiveAction } from "./types";

export async function getRules(): Promise<Rule[]> {
  const res = await api.get<Rule[]>("/rules");
  return res.data;
}

export async function getCorrectiveActions(associateId: string): Promise<CorrectiveAction[]> {
  if (!associateId) {
    return [];
  }
  try {
    const res = await api.get<CorrectiveAction[]>(`/corrective-actions/${associateId}`);
    if (Array.isArray(res.data)) {
      return res.data;
    } else {
      console.error("Expected an array of CorrectiveActions, but got:", res.data);
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

export const deleteCorrectiveAction = async (id: string): Promise<void> => {
  await api.delete(`/corrective-actions/${id}`);
};