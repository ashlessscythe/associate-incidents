import React, { useEffect, useState } from "react";
import AssociateSelect from "@/components/AssociateSelect";
import AssociatesTable from "@/components/AssociatesTable";
import NewAssociateModal from "@/components/NewAssociateModal";
import { addAssociate, deleteAssociate, AssociateAndDesignation } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import { useAssociatesWithDesignation } from "@/hooks/useAssociates";

const AssociatesPage: React.FC = () => {
  const { associatesWithDesignation, fetchAssociatesWithDesignation, loading, error } =
    useAssociatesWithDesignation();
  const [showTable, setShowTable] = useState(false);
  const [associates, setAssociates] = useState<AssociateAndDesignation[]>([]);
  const { user } = useAuthorizer();

  // Fetch associates on first load or when view switches to table
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchAssociatesWithDesignation();
        setAssociates(associatesWithDesignation); // Update state with fetched associates
      } catch (err) {
        console.error("Error fetching associates:", err);
      }
    };

    if (showTable) {
      fetchData(); // Fetch associates only when showing the table
    }
  }, [showTable, fetchAssociatesWithDesignation]); // Run when table view toggles

  const handleAddAssociate = async (name: string) => {
    try {
      await addAssociate(name);
      await fetchAssociatesWithDesignation(); // Refresh the associates list after adding a new one
    } catch (err) {
      console.error("Error adding associate:", err);
    }
  };

  const handleDeleteAssociate = async (id: string) => {
    try {
      await deleteAssociate(id); // Assume deleteAssociate is a function in your API
      await fetchAssociatesWithDesignation(); // Refresh the list after deletion
    } catch (err) {
      console.error("Error deleting associate:", err);
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
        <AssociatesTable associates={associates} onDelete={handleDeleteAssociate} />
      ) : (
        <AssociateSelect
          selectedAssociateId={null}
          onAssociateSelect={() => {}}
        />
      )}
    </div>
  );
};

export default AssociatesPage;
