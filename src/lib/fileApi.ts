import api from "./apiConfig";
import { UploadedFile } from "./types";

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

    // Map the response to match the UploadedFile interface
    const files: UploadedFile[] = response.data.map((file: any) => ({
      id: file.id,
      filename: file.filename,
      uploadDate: file.createdAt, // Assuming createdAt is the upload date
      mimetype: file.mimetype,
      size: file.size || 0,
    }));

    return files;
  } catch (error) {
    console.error("Error fetching uploaded files:", error);
    throw error;
  }
};

export const downloadFile = async (fileId: string): Promise<Blob> => {
  try {
    const response = await api.get(`/files/download/${fileId}`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Error downloading file:", error);
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
