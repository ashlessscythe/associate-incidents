// src/lib/api.ts
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export async function getAssociates() {
  const response = await axios.get(`${API_URL}/associates`);
  return response.data;
}

export async function getIncidents(associateId: string) {
  const response = await axios.get(`${API_URL}/incidents/${associateId}`);
  return response.data;
}

export async function getIncidentTypes() {
  const response = await axios.get(`${API_URL}/incident-types`);
  return response.data;
}

export async function addIncident(incidentData: {
  typeId: string;
  description: string;
  isVerbal: boolean;
  associateId: string;
}) {
  const response = await axios.post(`${API_URL}/incidents`, incidentData);
  return response.data;
}

// New functions for CRUD operations

export async function getIncident(id: string) {
  const response = await axios.get(`${API_URL}/incidents/single/${id}`);
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
  const response = await axios.put(`${API_URL}/incidents/${id}`, incidentData);
  return response.data;
}

export async function deleteIncident(id: string) {
  const response = await axios.delete(`${API_URL}/incidents/${id}`);
  return response.data;
}
