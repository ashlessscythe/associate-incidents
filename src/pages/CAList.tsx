import React from "react";
import { Associate, CorrectiveAction, Rule } from "@/lib/api";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthorizer } from "@authorizerdev/authorizer-react";

interface CAListProps {
  associate: Associate | null;
  correctiveActions: CorrectiveAction[];
  rules: Rule[];
  onEditCA: (ca: CorrectiveAction) => void;
  onDeleteCA: (id: string) => Promise<void>;
  isReadOnly: boolean;
}

const CAList: React.FC<CAListProps> = ({
  correctiveActions,
  rules,
  onEditCA,
  onDeleteCA,
}) => {
  const { user } = useAuthorizer();
  const getRuleDescription = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    return rule
      ? `${rule.type} - ${rule.code}: ${rule.description}`
      : "Unknown Rule";
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

  // const handlePrint = (associate: Associate | null, ca: CorrectiveAction) => {
  //   generateCAFormPDF(associate, ca);
  // };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Corrective Actions</h2>
      <p className="mb-4 font-medium">
        Active Corrective Actions: {activeCACount}
      </p>
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
                    {/* <Button
                      onClick={() => handlePrint(associate, ca)}
                      className="text-gray-500 hover:text-gray-700"
                      variant="ghost"
                      size="icon"
                      aria-label="Print corrective action"
                    >
                      <Printer size={20} />
                    </Button> */}
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
