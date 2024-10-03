import api from "./apiConfig";
import { Location, Department } from "./types";

export const getLocations = async (): Promise<Location[]> => {
  const response = await api.get<Location[]>("/locations");
  return response.data;
};

export const getDepartments = async (): Promise<Department[]> => {
  const response = await api.get<Department[]>("/departments");
  return response.data;
};