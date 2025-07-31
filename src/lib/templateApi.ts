import api from "./apiConfig";

export interface Template {
  id: string;
  filename: string;
  createdAt: string;
  mimetype: string;
  size: number;
}

export const uploadTemplate = async (
  file: File
): Promise<{ message: string; fileId: string }> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", "TEMPLATE");

    const response = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error uploading template:", error);
    throw error;
  }
};

export const getTemplates = async (): Promise<Template[]> => {
  try {
    const response = await api.get("/templates");
    return response.data;
  } catch (error) {
    console.error("Error getting templates:", error);
    throw error;
  }
};

export const downloadTemplate = async (type: "ca" | "occ"): Promise<Blob> => {
  try {
    const response = await api.get(`/templates/${type}`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Error downloading template:", error);
    throw error;
  }
}; 