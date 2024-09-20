import React, { useState } from "react";
import AssociateSelect from "@/components/AssociateSelect";
import AssociatesTable from "@/components/AssociatesTable";
import NewAssociateModal from "@/components/NewAssociateModal";
import { addAssociate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import { useAssociates } from "@/hooks/useAssociates";

const AssociatesPage: React.FC = () => {
  const { associatesWithInfo, associates, loading, error, refreshAssociates } =
    useAssociates();
  const [showTable, setShowTable] = useState(false);
  const { user } = useAuthorizer();

  const handleAddAssociate = async (name: string) => {
    try {
      await addAssociate(name);
      await refreshAssociates(); // Refresh the associates list after adding a new one
    } catch (err) {
      console.error("Error adding associate:", err);
      // You might want to show an error message to the user here
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
          associates={associatesWithInfo}
          selectedAssociateId={null}
          onAssociateSelect={() => {}}
        />
      )}
    </div>
  );
};

export default AssociatesPage;
