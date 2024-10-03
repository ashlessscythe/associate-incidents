import api from "./apiConfig";

export async function getAssociatesData(months: number = 12) {
  try {
    const res = await api.get(`/associates-data?months=${months}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching associates data:", err);
    return [];
  }
}

export async function getCAByTypeWithAssociateInfo(months: number = 12) {
  try {
    const res = await api.get(`/ca-by-type-with-info?months=${months}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching CA by type data with associate info:", err);
    throw err;
  }
}

export async function getCAByType(months: number = 12) {
  try {
    const res = await api.get(`/ca-by-type?months=${months}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching CA by type data:", err);
    return [];
  }
}