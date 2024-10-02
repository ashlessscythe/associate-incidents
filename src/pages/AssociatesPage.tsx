import React, { useState, useEffect } from "react";
import AssociateSelect from "@/components/AssociateSelect";
import AssociatesTable from "@/components/AssociatesTable";
import NewAssociateModal from "@/components/modals/NewAssociateModal";
import { addAssociate, deleteAssociate, updateAssociate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import { useAssociatesWithDesignation } from "@/hooks/useAssociates";
import { toast } from "react-hot-toast";

const AssociatesPage: React.FC = () => {
  const {
    associatesWithDesignation,
    loading,
    error,
    fetchAssociatesWithDesignation,
  } = useAssociatesWithDesignation();
  const [showTable, setShowTable] = useState(false);
  const { user } = useAuthorizer();

  useEffect(() => {
    if (showTable) {
      fetchAssociatesWithDesignation();
    }
  }, [showTable, fetchAssociatesWithDesignation]);

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
    try {
      await updateAssociate(id, name, departmentId, designation, location);
      await fetchAssociatesWithDesignation();
      toast.success("Associate updated successfully");
    } catch (error) {
      console.error("Error updating associate:", error);
      toast.error("Failed to update associate");
    }
  };

  const hasEditorRole =
    (user && Array.isArray(user.roles) && user.roles.includes("user-edit")) ||
    false;

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Associates</h1>
        <div className="flex flex-col sm:flex-row justify-between mb-4">
          <NewAssociateModal
            onAddAssociate={handleAddAssociate}
            hasEditorRole={hasEditorRole}
          />
          <Button
            onClick={() => setShowTable(!showTable)}
            className="mt-2 sm:mt-0"
          >
            {showTable ? "Show List View" : "Show All Associates"}
          </Button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-4">
        {showTable ? (
          <AssociatesTable
            associates={associatesWithDesignation}
            onDelete={handleDeleteAssociate}
            onEdit={handleEditAssociate}
          />
        ) : (
          <AssociateSelect
            selectedAssociateId={null}
            onAssociateSelect={() => {}}
          />
        )}
      </div>
    </div>
  );
};

export default AssociatesPage;
