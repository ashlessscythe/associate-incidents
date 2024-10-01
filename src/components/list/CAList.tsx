import React from "react";
import {
  Associate,
  CorrectiveAction,
  Rule,
  RuleType,
  exportExcelCA,
} from "@/lib/api";
import { Edit2, Trash2, Printer, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import { useCAPrint } from "@/hooks/useCAPrint";

interface CAListProps {
  associate: Associate | null;
  correctiveActions: CorrectiveAction[];
  rules: Rule[];
  onEditCA: (ca: CorrectiveAction) => void;
  onDeleteCA: (id: string) => Promise<void>;
  isReadOnly: boolean;
}

const CAList: React.FC<CAListProps> = ({
  associate,
  correctiveActions,
  rules,
  onEditCA,
  onDeleteCA,
}) => {
  const { user } = useAuthorizer();
  const handlePrint = useCAPrint();

  const getRuleDescription = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) {
      console.warn(`Rule not found for id: ${ruleId}`);
      return "Unknown Rule";
    }
    return `${rule.type} - ${rule.code}: ${rule.description}`;
  };

  const hasEditorRole =
    user && Array.isArray(user.roles) && user.roles.includes("ca-edit");

  const getLevelDescription = (level: number) => {
    switch (level) {
      case 1:
        return "1 - Coaching Conversation";
      case 2:
        return "2 - Documented Verbal Warning";
      case 3:
        return "3 - Written Warning";
      case 4:
        return "4 - Final Written Warning";
      case 5:
        return "5 - Termination";
      default:
        return `${level} - Unknown Level`;
    }
  };

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const sortedCorrectiveActions = [...correctiveActions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const activeCACount = sortedCorrectiveActions.filter(
    (ca) => new Date(ca.date) >= oneYearAgo
  ).length;

  const handleExcelExport = async () => {
    try {
      const currentDate = new Date().toISOString().split("T")[0];

      // Prepare corrective actions with rule information
      const preparedCorrectiveActions = sortedCorrectiveActions.map((ca) => {
        const rule = rules.find((r) => r.id === ca.ruleId);
        return {
          ...ca,
          rule: rule
            ? [rule]
            : [
                {
                  id: "unknown",
                  code: "Unknown",
                  description: "Unknown Rule",
                  type: RuleType.WORK,
                },
              ],
        };
      });

      console.log(
        "Prepared Corrective Actions for Excel export:",
        preparedCorrectiveActions
      );

      const blob = await exportExcelCA(
        associate?.name || "N/A",
        "N/A",
        "N/A",
        currentDate,
        preparedCorrectiveActions,
        "N/A"
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${associate?.name}_corrective_actions.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("An error occurred while exporting to Excel. Please try again.");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Corrective Actions</h2>
      <p className="mb-4 font-medium">
        Active Corrective Actions: {activeCACount}
      </p>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() =>
            handlePrint({
              associate,
              correctiveActions: sortedCorrectiveActions,
            })
          }
          className="text-light-500 hover:text-light-700 mr-2"
          variant="ghost"
          size="icon"
          aria-label="Print corrective actions list"
        >
          <Printer size={20} />
        </Button>
        <Button
          onClick={handleExcelExport}
          className="text-light-500 hover:text-light-700"
          variant="ghost"
          size="icon"
          aria-label="Export to Excel"
        >
          <FileSpreadsheet size={20} />
        </Button>
      </div>
      {sortedCorrectiveActions.length === 0 ? (
        <p>No corrective actions found.</p>
      ) : (
        <ul className="space-y-4">
          {sortedCorrectiveActions.map((ca) => {
            const isOld = new Date(ca.date) < oneYearAgo;
            return (
              <li
                key={ca.id}
                className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow ${
                  isOld ? "opacity-50" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className={isOld ? "line-through" : ""}>
                    <p className="font-semibold">
                      {getRuleDescription(ca.ruleId)}
                    </p>
                    <p>{getLevelDescription(ca.level)}</p>
                    <p>Date: {new Date(ca.date).toISOString().split("T")[0]}</p>
                    <p>Description: {ca.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    {hasEditorRole ? (
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
                    ) : (
                      <span className="text-gray-400">
                        No actions available
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CAList;
