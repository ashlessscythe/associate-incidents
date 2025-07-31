import React, { useState, useEffect, useRef } from "react";
import ImportErrorModal, {
  ImportError,
} from "@/components/modals/ImportErrorModal";
import AssociatesTable from "@/components/AssociatesTable";
import NewAssociateModal from "@/components/modals/NewAssociateModal";
import { addAssociate, deleteAssociate, updateAssociate, toggleAssociateActive, getDepartments, getLocations } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAssociatesWithDesignation } from "@/hooks/useAssociates";
import { toast } from "react-hot-toast";
import api from "@/lib/apiConfig";
import { Department, Location } from "@/lib/api";

const AssociatesPage: React.FC = () => {
  const {
    associatesWithDesignation,
    loading,
    error,
    fetchAssociatesWithDesignation,
    updateAssociateActiveStatus,
    updateAssociateOptimistically,
  } = useAssociatesWithDesignation();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [importSummary, setImportSummary] = useState({
    success: 0,
    skipped: 0,
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    fetchAssociatesWithDesignation();
  }, [fetchAssociatesWithDesignation]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedDepartments, fetchedLocations] = await Promise.all([
          getDepartments(),
          getLocations(),
        ]);
        setDepartments(fetchedDepartments);
        setLocations(fetchedLocations);
      } catch (error) {
        console.error("Error fetching departments and locations:", error);
      }
    };
    fetchData();
  }, []);

  const handleAddAssociate = async (name: string) => {
    try {
      await addAssociate(name);
      await fetchAssociatesWithDesignation();
    } catch (err) {
      console.error("Error adding associate:", err);
    }
  };

  const handleDeleteAssociate = async (id: string) => {
    try {
      await deleteAssociate(id);
      await fetchAssociatesWithDesignation();
    } catch (err) {
      console.error("Error deleting associate:", err);
    }
  };

  const handleEditAssociate = async (
    id: string,
    name: string,
    departmentId: string,
    designation: string,
    location: string
  ) => {
    // Find the current associate to get the original values for reverting on error
    const currentAssociate = associatesWithDesignation.find(a => a.id === id);
    if (!currentAssociate) return;

    // Find the department and location objects for the optimistic update
    const newDepartment = departments.find(d => d.id === departmentId);
    const newLocation = locations.find(l => l.id === location);

    // Create optimistic update
    const optimisticUpdate = {
      name,
      department: newDepartment,
      designation,
      location: newLocation,
    };

    // Apply optimistic update
    updateAssociateOptimistically(id, optimisticUpdate);

    try {
      await updateAssociate(id, name, departmentId, designation, location);
      toast.success("Associate updated successfully");
    } catch (error) {
      // Revert optimistic update on error
      updateAssociateOptimistically(id, {
        name: currentAssociate.name,
        department: currentAssociate.department,
        designation: currentAssociate.designation,
        location: currentAssociate.location,
      });
      console.error("Error updating associate:", error);
      toast.error("Failed to update associate");
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    const newState = !currentState;
    
    // Optimistically update the UI
    updateAssociateActiveStatus(id, newState);
    
    try {
      await toggleAssociateActive(id, currentState);
      toast.success("Associate status updated successfully");
    } catch (error) {
      // Revert the optimistic update on error
      updateAssociateActiveStatus(id, currentState);
      console.error("Error updating associate status:", error);
      toast.error("Failed to update associate status");
    }
  };

  const downloadTemplate = async () => {
    try {
      // Use axios to get the file with proper response type
      const response = await api.get("/download-associates-template", {
        responseType: "blob",
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "associates-template.csv";
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success("Template downloaded successfully");
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template");
    }
  };

  const downloadCurrentAssociates = async () => {
    try {
      // Use axios to get the file with proper response type
      const response = await api.get("/download-current-associates", {
        responseType: "blob",
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "current-associates.csv";
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success("Associates list downloaded successfully");
    } catch (error) {
      console.error("Error downloading associates list:", error);
      toast.error("Failed to download associates list");
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/associates-import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.errors && response.data.errors.length > 0) {
        // Show error modal with details
        setImportErrors(response.data.errors);
        setImportSummary({
          success: response.data.success || 0,
          skipped: response.data.skipped || 0,
        });
        setShowErrorModal(true);
        toast.error(
          `Import completed with ${response.data.errors.length} errors`
        );
      } else {
        toast.success(`Import successful: ${response.data.message}`);
      }

      await fetchAssociatesWithDesignation();

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error importing associates:", error);
      toast.error("Failed to import associates");
    }
  };

  const hasEditorRole =
    (user && Array.isArray(user.roles) && user.roles.includes("user-edit")) ||
    false;

  if (loading) return <div className="text-foreground">Loading...</div>;
  if (error) return <div className="text-foreground">Error: {error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Associates</h1>
        <div className="flex flex-col sm:flex-row justify-between mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <NewAssociateModal
              onAddAssociate={handleAddAssociate}
              hasEditorRole={hasEditorRole}
            />
            {hasEditorRole && (
              <>
                <Button onClick={handleImportClick} variant="outline">
                  Import Associates
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  style={{ display: "none" }}
                />
                <Button onClick={downloadTemplate} variant="outline">
                  Download Template
                </Button>
              </>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
            {hasEditorRole && (
              <Button onClick={downloadCurrentAssociates} variant="outline">
                Download Current Associates
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-4">
        <AssociatesTable
          associates={associatesWithDesignation}
          departments={departments}
          locations={locations}
          onDelete={handleDeleteAssociate}
          onEdit={handleEditAssociate}
          onToggleActive={handleToggleActive}
          hasEditorRole={hasEditorRole}
        />
      </div>

      <ImportErrorModal
        open={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={importErrors}
        summary={importSummary}
      />
    </div>
  );
};

export default AssociatesPage;
