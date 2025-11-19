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

export async function downloadAssociatesPointsReport() {
  try {
    const response = await api.get("/associates-points-report", {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "associates-points-report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error("Error downloading associates points report:", err);
    throw err;
  }
}

export async function getAttendanceOccurrencesReport() {
  try {
    const res = await api.get("/attendance-occurrences-report");
    return res.data;
  } catch (err) {
    console.error("Error fetching attendance occurrences report:", err);
    throw err;
  }
}

export async function downloadAttendanceOccurrencesReport() {
  try {
    const response = await api.get("/attendance-occurrences-report/download", {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "attendance-occurrences-report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error("Error downloading attendance occurrences report:", err);
    throw err;
  }
}
