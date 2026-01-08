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

export interface TemplateMapping {
  id: string;
  templateType: "CA" | "OCC";
  dataPoint: string;
  cellValue: string; // JSON string
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const getTemplateMappings = async (
  templateType?: "CA" | "OCC"
): Promise<TemplateMapping[]> => {
  try {
    const params = templateType ? { templateType } : {};
    const response = await api.get("/admin/template-mappings", { params });
    return response.data.mappings;
  } catch (error) {
    console.error("Error getting template mappings:", error);
    throw error;
  }
};

export const getTemplateMapping = async (
  id: string
): Promise<TemplateMapping> => {
  try {
    const response = await api.get(`/admin/template-mappings/${id}`);
    return response.data.mapping;
  } catch (error) {
    console.error("Error getting template mapping:", error);
    throw error;
  }
};

export const createOrUpdateTemplateMapping = async (
  templateType: "CA" | "OCC",
  dataPoint: string,
  cellValue: string | object,
  description?: string
): Promise<TemplateMapping> => {
  try {
    const cellValueStr =
      typeof cellValue === "string" ? cellValue : JSON.stringify(cellValue);
    const response = await api.post("/admin/template-mappings", {
      templateType,
      dataPoint,
      cellValue: cellValueStr,
      description,
    });
    return response.data.mapping;
  } catch (error) {
    console.error("Error creating/updating template mapping:", error);
    throw error;
  }
};

export const updateTemplateMapping = async (
  id: string,
  cellValue?: string | object,
  description?: string
): Promise<TemplateMapping> => {
  try {
    const data: any = {};
    if (cellValue !== undefined) {
      data.cellValue =
        typeof cellValue === "string" ? cellValue : JSON.stringify(cellValue);
    }
    if (description !== undefined) {
      data.description = description;
    }
    const response = await api.patch(`/admin/template-mappings/${id}`, data);
    return response.data.mapping;
  } catch (error) {
    console.error("Error updating template mapping:", error);
    throw error;
  }
};

export const deleteTemplateMapping = async (id: string): Promise<void> => {
  try {
    await api.delete(`/admin/template-mappings/${id}`);
  } catch (error) {
    console.error("Error deleting template mapping:", error);
    throw error;
  }
}; 