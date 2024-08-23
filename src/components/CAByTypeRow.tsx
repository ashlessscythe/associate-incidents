import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import CAList from "@/pages/CAList";
import {
  CorrectiveAction,
  getCorrectiveActions,
  getRules,
  Rule,
} from "../lib/api";

interface CAByTypeRowProps {
  associate: {
    id: string;
    name: string;
  };
  onEditCA: (ca: CorrectiveAction) => void;
  onDeleteCA: (id: string) => Promise<void>;
}

const CAByTypeRow: React.FC<CAByTypeRowProps> = ({
  associate,
  onEditCA,
  onDeleteCA,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [correctiveActions, setCorrectiveActions] = useState<
    CorrectiveAction[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && correctiveActions.length === 0) {
      fetchCorrectiveActions();
    }
  };

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const rulesData = await getRules();
        setRules(rulesData);
      } catch (err: unknown) {
        console.error("Error fetching rules", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    };
    fetchRules();
  }, []);

  const fetchCorrectiveActions = async () => {
    try {
      const caData = await getCorrectiveActions(associate.id);
      setCorrectiveActions(caData);
    } catch (err: unknown) {
      console.error("Error fetching corrective actions", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  return (
    <li className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div className="flex justify-between items-center">
        <span className="font-semibold">{associate.name}</span>
        <Button onClick={toggleExpand} variant="ghost" size="sm">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </Button>
      </div>
      {isExpanded && (
        <div className="mt-4">
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <CAList
            correctiveActions={correctiveActions}
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
