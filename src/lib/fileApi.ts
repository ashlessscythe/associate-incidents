import api from "./apiConfig";

export interface UploadedFile {
  id: string;
  filename: string;
  uploadDate: string;
  mimetype: string;
}

export const uploadFile = async (formData: FormData): Promise<void> => {
  try {
    await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const getUploadedFiles = async (
  associateId: string
): Promise<UploadedFile[]> => {
  try {
    const response = await api.get(`/files/${associateId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching uploaded files:", error);
    throw error;
  }
};

export const deleteFile = async (fileId: string): Promise<void> => {
  try {
    await api.delete(`/files/${fileId}`);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};
