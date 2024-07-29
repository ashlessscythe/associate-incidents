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
