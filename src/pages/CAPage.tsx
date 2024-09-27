import { useState, useEffect } from "react";
import {
  getRules,
  getCorrectiveActions,
  addCorrectiveAction,
  updateCorrectiveAction,
  Associate,
  Rule,
  CorrectiveAction,
  deleteCorrectiveAction,
  getAssociateById,
} from "@/lib/api";
import AssociateSelect from "@/components/AssociateSelect";
import CAForm from "./CAForm";
import CAList from "./CAList";
import CAEditModal from "@/components/CAEditModal";
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import { useAssociatesWithDesignation } from "@/hooks/useAssociates";

function CAPage() {
  const { user } = useAuthorizer();
  const { loading: associatesLoading, error: associatesError } =
    useAssociatesWithDesignation();
  const [rules, setRules] = useState<Rule[]>([]);
  const [correctiveActions, setCorrectiveActions] = useState<
    CorrectiveAction[]
  >([]);
  const [editingCA, setEditingCA] = useState<CorrectiveAction | null>(null);
  const [selectedAssociate, setSelectedAssociate] = useState<Associate | null>(
    null
  );
  const [selectedAssociateId, setSelectedAssociateId] = useState<string | null>(
    ""
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasEditorRole =
    user && Array.isArray(user.roles) && user.roles.includes("ca-edit");

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const rulesData = await getRules();
        setRules(rulesData);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, []);

  useEffect(() => {
    fetchCorrectiveActions();
  }, [selectedAssociate?.id]);

  const fetchCorrectiveActions = async () => {
    if (selectedAssociate?.id) {
      try {
        const caData = await getCorrectiveActions(selectedAssociate.id);
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
      const associate = await getAssociateById(associateId);
      setSelectedAssociate(associate);
    } else {
      setSelectedAssociate(null);
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
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex-grow flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/3 xl:w-1/4 p-4 lg:overflow-y-auto">
          <div className="sticky top-0 lg:top-4 z-10 bg-gray-100 dark:bg-gray-900 p-4 shadow-md">
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
        <div className="lg:w-2/3 xl:w-3/4 p-4 overflow-y-auto">
          {!hasEditorRole && (
            <div
              className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4"
              role="alert"
            >
              <p className="font-bold">View Only Mode</p>
              <p>
                You do not have permission to add or edit corrective actions.
              </p>
            </div>
          )}
          <CAList
            associate={selectedAssociate}
            correctiveActions={correctiveActions}
            rules={rules}
            onDeleteCA={handleDeleteCA}
            onEditCA={handleEditCA}
            isReadOnly={false}
          />
        </div>
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
