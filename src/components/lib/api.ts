// src/lib/api.ts
import axios from "axios";

// Create an axios instance
const api = axios.create({
  baseURL: '/api',
});

// Function to set the auth token
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export async function getAssociates() {
  const response = await api.get(`/associates`);
  return response.data;
}

export async function getIncidents(associateId: string) {
  const response = await api.get(`/incidents/${associateId}`);
  return response.data;
}

export async function getIncidentTypes() {
  const response = await api.get(`/incident-types`);
  return response.data;
}

export async function addIncident(incidentData: {
  typeId: string;
  description: string;
  isVerbal: boolean;
  associateId: string;
}) {
  const response = await api.post(`/incidents`, incidentData);
  return response.data;
}

// New functions for CRUD operations

export async function getIncident(id: string) {
  const response = await api.get(`/incidents/single/${id}`);
  return response.data;
}

export async function updateIncident(
  id: string,
  incidentData: {
    typeId?: string;
    description?: string;
    isVerbal?: boolean;
  }
) {
  const response = await api.put(`/incidents/${id}`, incidentData);
  return response.data;
}

export async function deleteIncident(id: string) {
  const response = await api.delete(`/incidents/${id}`);
  return response.data;
}
