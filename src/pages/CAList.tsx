import React from "react";
import { CorrectiveAction, Rule } from "@/components/lib/api";
import { Trash2 } from "lucide-react";

interface CAListProps {
  correctiveActions: CorrectiveAction[];
  rules: Rule[];
  onDeleteCA: (id: string) => Promise<void>;
}

const CAList: React.FC<CAListProps> = ({
  correctiveActions,
  rules,
  onDeleteCA,
}) => {
  const getRuleDescription = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    return rule
      ? `${rule.type} - ${rule.code}: ${rule.description}`
      : "Unknown Rule";
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
                    <p>Level: {ca.level}</p>
                    <p>Date: {new Date(ca.date).toISOString().split("T")[0]}</p>
                    <p>Description: {ca.description}</p>
                  </div>
                  <button
                    onClick={() => onDeleteCA(ca.id)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="Delete corrective action"
                  >
                    <Trash2 size={20} />
                  </button>
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
