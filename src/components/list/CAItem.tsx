import React, { useState } from "react";
import { CorrectiveAction, Rule, exportExcelCA } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Edit2, Trash2 } from "lucide-react";
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import ExportCADetailsModal from "../modals/ExportCADetailsModal";

interface CAItemProps {
  ca: CorrectiveAction;
  rules: Rule[];
  onEditCA: (ca: CorrectiveAction) => void;
  onDeleteCA: (id: string) => Promise<void>;
  associateName: string;
  level: number;
  associateLocation?: string;
  associateDepartment?: string;
}

const CAItem: React.FC<CAItemProps> = ({
  ca,
  rules,
  onEditCA,
  onDeleteCA,
  associateName,
  level,
  associateLocation,
  associateDepartment,
}) => {
  const { user } = useAuthorizer();
  const hasEditorRole =
    user && Array.isArray(user.roles) && user.roles.includes("ca-edit");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const getRuleDescription = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    return rule
      ? `${rule.type} - ${rule.code}: ${rule.description}`
      : "Unknown Rule";
  };

  const getLevelDescription = (level: number) => {
    switch (level) {
      case 0:
        return "0 - Coaching";
      case 1:
        return "1 - Documented Verbal Warning";
      case 2:
        return "2 - Written Warning";
      case 3:
        return "3 - Final Written Warning";
      case 4:
        return "4 - Termination";
      default:
        return `${level} - Unknown Level`;
    }
  };

  const handleExport = async (
    selectedLocation: string,
    selectedDepartment: string
  ) => {
    const location = associateLocation || selectedLocation;
    const department = associateDepartment || selectedDepartment;
    try {
      const blob = await exportExcelCA(
        associateName,
        location,
        department,
        new Date().toISOString().split("T")[0], // current date
        ca, // single CA
        getLevelDescription(level) // notification level
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${associateName}_corrective_action.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("An error occurred while exporting to Excel. Please try again.");
    }
  };

  const handleExportClick = () => {
    if (associateLocation && associateDepartment) {
      handleExport(associateLocation, associateDepartment);
    } else {
      setIsExportModalOpen(true);
    }
  };

  return (
    <li className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold">{getRuleDescription(ca.ruleId)}</p>
          <p>{getLevelDescription(level)}</p>
          <p>Date: {new Date(ca.date).toISOString().split("T")[0]}</p>
          <p>Description: {ca.description}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setIsExportModalOpen(true)}
            className="text-green-500 hover:text-green-700"
            variant="ghost"
            size="icon"
            aria-label="Export corrective action"
          >
            <FileSpreadsheet size={20} />
          </Button>
          {hasEditorRole && (
            <>
              <Button
                onClick={() => onEditCA(ca)}
                className="text-blue-500 hover:text-blue-700"
                variant="ghost"
                size="icon"
              >
                <Edit2 size={20} />
              </Button>
              <Button
                onClick={() => onDeleteCA(ca.id)}
                className="text-red-500 hover:text-red-700"
                aria-label="Delete corrective action"
              >
                <Trash2 size={20} />
              </Button>
            </>
          )}
        </div>
      </div>
      <ExportCADetailsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportClick}
        initialDepartment={associateDepartment}
        initialLocation={associateLocation}
      />
    </li>
  );
};

export default CAItem;
