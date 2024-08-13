// src/lib/api.ts
import axios from "axios";

// removed api localhost
// const API_URL = 'localhost:5000/api'

export async function getAssociates() {
  const response = await axios.get(`/api/associates`);
  return response.data;
}

export async function getIncidentTypes() {
  const response = await axios.get(`/api/incident-types`);
  return response.data;
}

export async function addIncident(incidentData: {
  typeId: string;
  description: string;
  isVerbal: boolean;
  associateId: string;
}) {
  const response = await axios.post(`/api/incidents`, incidentData);
  return response.data;
}

// New functions for CRUD operations

export async function getIncidents(associateId: string) {
  const response = await axios.get(`/api/incidents/${associateId}`);
  return response.data;
}

export async function getIncident(id: string) {
  const response = await axios.get(`/api/incidents/single/${id}`);
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
  const response = await axios.put(`/api/incidents/${id}`, incidentData);
  return response.data;
}

export async function deleteIncident(id: string) {
  const response = await axios.delete(`/api/incidents/${id}`);
  return response.data;
}
