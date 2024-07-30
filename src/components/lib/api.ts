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
