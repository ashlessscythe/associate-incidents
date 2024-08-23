import React from "react";
import { CorrectiveAction, Rule } from "@/lib/api";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CAListProps {
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
  const getRuleDescription = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    return rule
      ? `${rule.type} - ${rule.code}: ${rule.description}`
      : "Unknown Rule";
  };

  const getLevelDescription = (level: number) => {
    switch (level) {
      case 0:
        return "0 - Coaching Conversation";
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

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const sortedCorrectiveActions = [...correctiveActions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const activeCACount = sortedCorrectiveActions.filter(
    (ca) => new Date(ca.date) >= oneYearAgo
  ).length;

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
                    <p>Level: {getLevelDescription(ca.level)}</p>
                    <p>Date: {new Date(ca.date).toISOString().split("T")[0]}</p>
                    <p>Description: {ca.description}</p>
                  </div>
                  <div className="flex space-x-2">
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
