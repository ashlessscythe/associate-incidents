import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  getRules,
  getCorrectiveActions,
  addCorrectiveAction,
  updateCorrectiveAction,
  Rule,
  CorrectiveAction,
  deleteCorrectiveAction,
  getAssociatePointsAndNotification,
  AssociateInfo,
  AssociateAndDesignation,
} from "../lib/api";
import AssociateSelect from "../components/AssociateSelect";
import CAForm from "../components/form/CAForm";
import CAList from "../components/list/CAList";
import CAEditModal from "../components/modals/CAEditModal";
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import { useAssociatesWithDesignation } from "../hooks/useAssociates";
import { uploadFile, downloadFile, deleteFile } from "../lib/api";
import { toast } from "react-hot-toast";

function CAPage() {
  const { user } = useAuthorizer();
  const {
    associatesWithDesignation,
    fetchAssociatesWithDesignation,
    loading: associatesLoading,
    error: associatesError,
  } = useAssociatesWithDesignation();
  const [rules, setRules] = useState<Rule[]>([]);
  const [correctiveActions, setCorrectiveActions] = useState<
    CorrectiveAction[]
  >([]);
  const [editingCA, setEditingCA] = useState<CorrectiveAction | null>(null);
  const [selectedAssociate, setSelectedAssociate] =
    useState<AssociateAndDesignation | null>(null);
  const [selectedAssociateId, setSelectedAssociateId] = useState<string | null>(
    null
  );
  const [associateInfo, setAssociateInfo] = useState<AssociateInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const hasEditorRole =
    user && Array.isArray(user.roles) && user.roles.includes("ca-edit");

  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const associateId = searchParams.get("associateId");
    console.log("AssociateId from URL:", associateId);
    if (associateId) {
      handleAssociateSelect(associateId);
    }
  }, [location]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [rulesData] = await Promise.all([
          getRules(),
          fetchAssociatesWithDesignation(),
        ]);
        setRules(rulesData);
        console.log("Rules fetched:", rulesData);
        console.log("Associates fetched:", associatesWithDesignation);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        console.error("Error fetching initial data:", errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [fetchAssociatesWithDesignation]);

  useEffect(() => {
    if (selectedAssociateId) {
      console.log("Selected Associate ID changed:", selectedAssociateId);
      fetchCorrectiveActions();
      fetchAssociateInfo(selectedAssociateId);
    } else {
      setCorrectiveActions([]);
      setAssociateInfo(null);
    }
  }, [selectedAssociateId]);

  const fetchCorrectiveActions = async () => {
    if (selectedAssociateId) {
      try {
        const caData = await getCorrectiveActions(selectedAssociateId);
        console.log("Corrective Actions fetched:", caData);
        setCorrectiveActions(caData);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        console.error("Error fetching corrective actions:", errorMessage);
        setError(errorMessage);
      }
    } else {
      setCorrectiveActions([]);
    }
  };

  const fetchAssociateInfo = async (associateId: string) => {
    try {
      const associateInfoData = await getAssociatePointsAndNotification(
        associateId
      );
      console.log("Associate Info fetched:", associateInfoData);
      setAssociateInfo(associateInfoData);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      console.error("Error fetching associate info:", errorMessage);
      setError(errorMessage);
    }
  };

  const handleEditCA = (ca: CorrectiveAction) => {
    setEditingCA(ca);
  };

  const handleUpdateCA = async (updatedCA: CorrectiveAction) => {
    try {
      await updateCorrectiveAction(updatedCA.id, updatedCA);
      await fetchCorrectiveActions();
      setEditingCA(null);
    } catch (error) {
      console.error("Failed to update corrective action:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An unknown error occurred while updating the CA"
      );
    }
  };

  const handleAssociateSelect = async (associateId: string | null) => {
    console.log("Associate selected:", associateId);
    setSelectedAssociateId(associateId);
    if (associateId) {
      console.log("Associates with designation:", associatesWithDesignation);
      const selectedAssociate = associatesWithDesignation.find(
        (a) => a.id === associateId
      );
      if (selectedAssociate) {
        console.log("Selected Associate:", selectedAssociate);
        setSelectedAssociate(selectedAssociate);
        fetchAssociateInfo(associateId);
      } else {
        console.error(
          "Selected associate not found in associatesWithDesignation"
        );
        console.log("Attempting to fetch associate info directly");
        try {
          const associateInfoData = await getAssociatePointsAndNotification(
            associateId
          );
          console.log("Associate Info fetched directly:", associateInfoData);
          setAssociateInfo(associateInfoData);
          setSelectedAssociate({
            id: associateId,
            name: associateInfoData.name,
            designation: associateInfoData.designation,
          });
        } catch (err) {
          console.error("Error fetching associate info directly:", err);
          setError("Selected associate not found and could not be fetched");
          setSelectedAssociate(null);
          setAssociateInfo(null);
        }
      }
    } else {
      setSelectedAssociate(null);
      setAssociateInfo(null);
    }
  };

  const handleAddCorrectiveAction = async (caData: {
    ruleId: string;
    description: string;
    level: number;
    date: Date;
  }) => {
    if (selectedAssociateId) {
      try {
        await addCorrectiveAction({
          ...caData,
          associateId: selectedAssociateId,
        });
        await fetchCorrectiveActions();
        await fetchAssociateInfo(selectedAssociateId);
        await fetchAssociatesWithDesignation();
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error ? e.message : "An unknown error occurred";
        console.error("Error adding corrective action:", errorMessage);
        setError(errorMessage);
      }
    }
  };

  const handleDeleteCA = async (id: string) => {
    const isConfirmed = window.confirm("Are you sure you want to delete?");
    if (!isConfirmed) return;

    try {
      await deleteCorrectiveAction(id);
      setCorrectiveActions((prevCAs) => prevCAs.filter((ca) => ca.id !== id));
    } catch (error) {
      console.error("Failed to delete corrective action:", error);
      alert(
        error instanceof Error
          ? `Failed to delete CA: ${error.message}`
          : "An unknown error occurred while deleting the CA"
      );
    }
  };

  const handleUploadFile = async (caId: string, file: File) => {
    if (selectedAssociateId) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("associateId", selectedAssociateId);
        formData.append("correctiveActionId", caId);

        const result = await uploadFile(formData);
        toast.success(result.message);
        await fetchCorrectiveActions();
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error("Failed to upload file. Please try again.");
      }
    }
  };

  const handleDownloadFile = async (fileId: string, filename: string) => {
    try {
      const file = await downloadFile(fileId);
      const url = window.URL.createObjectURL(file);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file. Please try again.");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      toast.success("File deleted successfully");
      await fetchCorrectiveActions();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file. Please try again.");
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (associatesLoading || loading) return <div>Loading...</div>;
  if (associatesError || error)
    return (
      <div className="text-red-500">Error: {associatesError || error}</div>
    );

  return (
    <div className="flex flex-col md:flex-row h-full relative bg-background text-foreground">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "w-full md:w-1/2 lg:w-2/5 xl:w-1/3" : "w-0"
        } transition-all duration-300 ease-in-out overflow-hidden md:h-full bg-card text-card-foreground shadow-md`}
      >
        <div className="sticky top-0 z-10 p-4 space-y-4">
          <AssociateSelect
            selectedAssociateId={selectedAssociateId}
            onAssociateSelect={handleAssociateSelect}
          />
          {hasEditorRole && (
            <CAForm
              rules={rules}
              associateId={selectedAssociateId}
              onAddCorrectiveAction={handleAddCorrectiveAction}
            />
          )}
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-4 z-20 bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-r-md shadow-md transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? "left-[calc(50%-1rem)] md:left-[calc(40%-1rem)] lg:left-[calc(33.33%-1rem)]"
            : "left-0"
        }`}
      >
        {isSidebarOpen ? "←" : "→"}
      </button>

      {/* Main content area */}
      <div
        className={`flex-grow p-4 md:h-full overflow-y-auto transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "md:ml-4" : "md:ml-0"
        }`}
      >
        {!hasEditorRole && (
          <div
            className="bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-200 p-4 mb-4 rounded-lg"
            role="alert"
          >
            <p className="font-bold">View Only Mode</p>
            <p>You do not have permission to add or edit corrective actions.</p>
          </div>
        )}
        {associateInfo && selectedAssociate && (
          <CAList
            associate={selectedAssociate}
            associateInfo={associateInfo}
            correctiveActions={correctiveActions}
            rules={rules}
            onDeleteCA={handleDeleteCA}
            onEditCA={handleEditCA}
            onUploadFile={handleUploadFile}
            onDownloadFile={handleDownloadFile}
            onDeleteFile={handleDeleteFile}
          />
        )}
      </div>
      {editingCA && (
        <CAEditModal
          ca={editingCA}
          rules={rules}
          onUpdate={handleUpdateCA}
          onClose={() => setEditingCA(null)}
        />
      )}
    </div>
  );
}

export default CAPage;
