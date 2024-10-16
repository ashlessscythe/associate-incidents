import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import CAList from "@/components/list/CAList";
import { AssociateInfo, CorrectiveAction, Rule } from "../../lib/api";

interface CAByTypeRowProps {
  associate: {
    id: string;
    name: string;
    correctiveActions: CorrectiveAction[];
  };
  associateInfo: AssociateInfo;
  rules: Rule[];
}

const CAByTypeRow: React.FC<CAByTypeRowProps> = ({
  associate,
  associateInfo,
  rules,
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

    return Object.entries(totals)
      .sort(([ruleA], [ruleB]) => ruleA.localeCompare(ruleB))
      .reduce((acc, [rule, count]) => {
        acc[rule] = count;
        return acc;
      }, {} as { [key: string]: number });
  }, [associate.correctiveActions, rules]);

  return (
    <li className="bg-card text-card-foreground rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-4 bg-muted hover:bg-muted/80 transition-colors duration-150">
        <div className="flex items-center space-x-4">
          <span className="font-semibold">{associate.name}</span>
          <Link
            to={`/attendance?associateId=${associate.id}`}
            className="text-primary hover:text-primary/80 mr-2"
          >
            Occurrences
          </Link>
          <Link
            to={`/ca?associateId=${associate.id}`}
            className="text-secondary hover:text-secondary/80"
          >
            CA
          </Link>
          <ArrowRight size={20} className="text-muted-foreground" />
          <div className="flex items-center space-x-2">
            {Object.entries(sortedCaTotals).map(([code, count]) => (
              <span
                key={code}
                className="text-sm bg-accent text-accent-foreground px-2 py-1 rounded"
              >
                {code}: {count}
              </span>
            ))}
          </div>
        </div>
        <Button onClick={toggleExpand} variant="ghost" size="sm">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </Button>
      </div>
      {isExpanded && (
        <div className="mt-2 p-4">
          <CAList
            associate={associate}
            associateInfo={associateInfo}
            correctiveActions={associate.correctiveActions}
            rules={rules}
          />
        </div>
      )}
    </li>
  );
};

export default CAByTypeRow;
