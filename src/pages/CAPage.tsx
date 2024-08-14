import { useEffect, useState } from "react";
import {
  Associate,
  getAssociates,
  getRules,
  getCorrectiveActions,
  addCorrectiveAction,
  Rule,
  CorrectiveAction,
} from "@/components/lib/api";
import AssociateList from "@/pages/AssociateList";
import CAForm from "./CAForm";
import CAList from "./CAList";

function CAPage() {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [correctiveActions, setCorrectiveActions] = useState<
    CorrectiveAction[]
  >([]);
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

  const handleAssociateSelect = (associateId: string | null) => {
    setSelectedAssociateId(associateId);
  };

  const handleAddCorrectiveAction = async (caData: {
    ruleId: string;
    description: string;
    level: number;
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <AssociateList
        associates={associates}
        selectedAssociateId={selectedAssociateId}
        onSelectAssociate={handleAssociateSelect}
      />
      <CAForm
        rules={rules}
        associateId={selectedAssociateId}
        onAddCorrectiveAction={handleAddCorrectiveAction}
      />
      <CAList correctiveActions={correctiveActions} rules={rules} />
    </div>
  );
}

export default CAPage;
