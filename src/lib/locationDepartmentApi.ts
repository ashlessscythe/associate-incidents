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

export interface AdminDepartment extends Department {
  associateCount: number;
}

export const getAdminDepartments = async (): Promise<AdminDepartment[]> => {
  const response = await api.get<{ departments: AdminDepartment[] }>(
    "/admin/departments"
  );
  return response.data.departments;
};

export const createDepartment = async (name: string): Promise<AdminDepartment> => {
  const response = await api.post<{ department: AdminDepartment }>(
    "/admin/departments",
    { name }
  );
  return response.data.department;
};

export const updateDepartment = async (
  id: string,
  name: string
): Promise<AdminDepartment> => {
  const response = await api.patch<{ department: AdminDepartment }>(
    `/admin/departments/${id}`,
    { name }
  );
  return response.data.department;
};

export const deleteDepartment = async (id: string): Promise<void> => {
  await api.delete(`/admin/departments/${id}`);
};