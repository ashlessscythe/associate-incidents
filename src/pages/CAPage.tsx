import { useEffect, useState } from "react";
import {
  Associate,
  getAssociates,
  getRules,
  getCorrectiveActions,
  addCorrectiveAction,
  updateCorrectiveAction,
  Rule,
  CorrectiveAction,
  deleteCorrectiveAction,
} from "@/lib/api";
import AssociateSelect from "@/components/AssociateSelect";
import CAForm from "./CAForm";
import CAList from "./CAList";
import CAEditModal from "@/components/CAEditModal";

function CAPage() {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [correctiveActions, setCorrectiveActions] = useState<
    CorrectiveAction[]
  >([]);
  const [editingCA, setEditingCA] = useState<CorrectiveAction | null>(null);
  const [selectedAssociateId, setSelectedAssociateId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [associatesData, rulesData] = await Promise.all([
          getAssociates(),
          getRules(),
        ]);
        setAssociates(associatesData);
        setRules(rulesData);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    fetchCorrectiveActions();
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
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred while updating the CA");
      }
    }
  };

  const handleAssociateSelect = (associateId: string | null) => {
    setSelectedAssociateId(associateId);
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

    if (!isConfirmed) {
      return; // do nothing
    }
    try {
      await deleteCorrectiveAction(id);
      // Update your state to remove the deleted corrective action
      setCorrectiveActions((prevCAs) => prevCAs.filter((ca) => ca.id !== id));
    } catch (error) {
      console.error("Failed to delete corrective action:", error);
      // Handle error (e.g., show an error message to the user)
      if (error instanceof Error) {
        alert(`Failed to delete CA: ${error.message}`);
      } else {
        alert("An unknown error occured while deleting the CA");
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <AssociateSelect
        associates={associates}
        selectedAssociateId={selectedAssociateId}
        onAssociateSelect={handleAssociateSelect}
      />
      <CAForm
        rules={rules}
        associateId={selectedAssociateId}
        onAddCorrectiveAction={handleAddCorrectiveAction}
      />
      <CAList
        correctiveActions={correctiveActions}
        rules={rules}
        onDeleteCA={handleDeleteCA}
        onEditCA={handleEditCA}
      />
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
