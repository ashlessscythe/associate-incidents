import React, { useState, useMemo } from "react";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import CAList from "@/pages/CAList";
import { CorrectiveAction, Rule } from "../lib/api";

interface CAByTypeRowProps {
  associate: {
    id: string;
    name: string;
    correctiveActions: CorrectiveAction[];
  };
  rules: Rule[];
  onEditCA: (ca: CorrectiveAction) => void;
  onDeleteCA: (id: string) => Promise<void>;
}

const CAByTypeRow: React.FC<CAByTypeRowProps> = ({
  associate,
  rules,
  onEditCA,
  onDeleteCA,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const sortedCaTotals = useMemo(() => {
    const totals: { [key: string]: number } = {};
    associate.correctiveActions.forEach((ca) => {
      const rule = rules.find((r) => r.id === ca.ruleId);
      if (rule) {
        totals[rule.code] = (totals[rule.code] || 0) + 1;
      }
    });

    // Convert totals to an array of [ruleCode, count] and sort by rule code
    return Object.entries(totals)
      .sort(([ruleA], [ruleB]) => ruleA.localeCompare(ruleB))
      .reduce((acc, [rule, count]) => {
        acc[rule] = count;
        return acc;
      }, {} as { [key: string]: number });
  }, [associate.correctiveActions, rules]);

  return (
    <li className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">
      <div className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-150">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-gray-800 dark:text-white">
            {associate.name}
          </span>
          <ArrowRight size={20} className="text-gray-400 dark:text-gray-500" />
          <div className="flex items-center space-x-2">
            {Object.entries(sortedCaTotals).map(([code, count]) => (
              <span
                key={code}
                className="text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white px-2 py-1 rounded"
              >
                {code}: {count}
              </span>
            ))}
          </div>
        </div>
        <Button
          onClick={toggleExpand}
          variant="ghost"
          size="sm"
          className="text-gray-800 dark:text-white"
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </Button>
      </div>
      {isExpanded && (
        <div className="mt-2 p-4">
          <CAList
            correctiveActions={associate.correctiveActions}
            rules={rules}
            onDeleteCA={onDeleteCA}
            onEditCA={onEditCA}
            isReadOnly={true}
          />
        </div>
      )}
    </li>
  );
};

export default CAByTypeRow;
