import React, { useEffect, useState } from "react";
import AssociateSelect from "@/components/AssociateSelect";
import AssociatesTable from "@/components/AssociatesTable";
import NewAssociateModal from "@/components/NewAssociateModal";
import {
  addAssociate,
  deleteAssociate,
  AssociateAndDesignation,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import { useAssociatesWithDesignation } from "@/hooks/useAssociates";

const AssociatesPage: React.FC = () => {
  const {
    associatesWithDesignation,
    fetchAssociatesWithDesignation,
    loading,
    error,
  } = useAssociatesWithDesignation();
  const [showTable, setShowTable] = useState(false);
  const [associates, setAssociates] = useState<AssociateAndDesignation[]>([]);
  const { user } = useAuthorizer();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchAssociatesWithDesignation();
        setAssociates(associatesWithDesignation);
      } catch (err) {
        console.error("Error fetching associates:", err);
      }
    };

    if (showTable) {
      fetchData();
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
            associates={associates}
            onDelete={handleDeleteAssociate}
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
