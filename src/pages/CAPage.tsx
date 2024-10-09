import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  getRules,
  getCorrectiveActions,
  addCorrectiveAction,
  updateCorrectiveAction,
  Associate,
  Rule,
  CorrectiveAction,
  deleteCorrectiveAction,
  getAssociatePointsAndNotification,
  AssociateInfo,
} from "@/lib/api";
import AssociateSelect from "@/components/AssociateSelect";
import CAForm from "../components/form/CAForm";
import CAList from "../components/list/CAList";
import CAEditModal from "@/components/modals/CAEditModal";
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import { useAssociatesWithDesignation } from "@/hooks/useAssociates";

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
  const [selectedAssociate, setSelectedAssociate] = useState<Associate | null>(
    null
  );
  const [selectedAssociateId, setSelectedAssociateId] = useState<string | null>(
    null
  );
  const [associateInfo, setAssociateInfo] = useState<AssociateInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasEditorRole =
    user && Array.isArray(user.roles) && user.roles.includes("ca-edit");

  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const associateId = searchParams.get("associateId");
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
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [fetchAssociatesWithDesignation]);

  useEffect(() => {
    if (selectedAssociateId) {
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
        setCorrectiveActions(caData);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
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
      setAssociateInfo(associateInfoData);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
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
    setSelectedAssociateId(associateId);
    if (associateId) {
      const selectedAssociate = associatesWithDesignation.find(
        (a) => a.id === associateId
      );
      setSelectedAssociate(selectedAssociate || null);
      fetchAssociateInfo(associateId);
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
        setError(e instanceof Error ? e.message : "An unknown error occurred");
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

  if (associatesLoading || loading) return <div>Loading...</div>;
  if (associatesError || error)
    return <div>Error: {associatesError || error}</div>;

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Sidebar */}
      <div className="w-full md:w-1/2 lg:w-2/5 xl:w-1/3 p-4 md:h-full overflow-y-auto">
        <div className="sticky top-4 z-10 bg-white dark:bg-gray-800 p-4 shadow-md rounded-lg space-y-4">
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

      {/* Main content area */}
      <div className="flex-grow p-4 md:h-full overflow-y-auto">
        {!hasEditorRole && (
          <div
            className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-lg"
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
