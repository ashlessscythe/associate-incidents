import React, { useState, useEffect } from "react";
import AssociateSelect from "@/components/AssociateSelect";
import AssociatesTable from "@/components/AssociatesTable";
import NewAssociateModal from "@/components/NewAssociateModal";
import { addAssociate, getAssociatesData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Associate } from "@/types/associate";
import { useAuthorizer } from "@authorizerdev/authorizer-react";

const AssociatesPage: React.FC = () => {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const { user } = useAuthorizer();

  useEffect(() => {
    fetchAssociates();
  }, []);

  const fetchAssociates = async () => {
    try {
      const data = await getAssociatesData();
      setAssociates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssociate = async (name: string) => {
    try {
      await addAssociate(name);
      await fetchAssociates(); // Refresh the list after adding
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const hasEditorRole =
    (user && Array.isArray(user.roles) && user.roles.includes("user-edit")) ||
    false;

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Associates</h1>
      <div className="flex justify-between mb-4">
        <NewAssociateModal
          onAddAssociate={handleAddAssociate}
          hasEditorRole={hasEditorRole}
        />
        <Button onClick={() => setShowTable(!showTable)}>
          {showTable ? "Show List View" : "Show All Associates"}
        </Button>
      </div>
      {showTable ? (
        <AssociatesTable associates={associates} />
      ) : (
        <AssociateSelect
          associates={associates}
          selectedAssociateId={null}
          onAssociateSelect={() => {}}
        />
      )}
    </div>
  );
};

export default AssociatesPage;
