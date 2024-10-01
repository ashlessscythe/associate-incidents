import React from "react";
import { Associate, CorrectiveAction, Rule } from "@/lib/api";
import CAItem from "./CAItem";

interface CAListProps {
  associate: Associate | null;
  correctiveActions: CorrectiveAction[];
  rules: Rule[];
  onEditCA: (ca: CorrectiveAction) => void;
  onDeleteCA: (id: string) => Promise<void>;
}

const CAList: React.FC<CAListProps> = ({
  associate,
  correctiveActions,
  rules,
  onEditCA,
  onDeleteCA,
}) => {
  // Group CAs by rule type and code
  const groupedCAs = correctiveActions.reduce((acc, ca) => {
    const rule = rules.find((r) => r.id === ca.ruleId);
    if (rule) {
      const key = `${rule.type}-${rule.code}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(ca);
    }
    return acc;
  }, {} as Record<string, CorrectiveAction[]>);

  // Sort groups by date of the most recent CA
  const sortedGroups = Object.entries(groupedCAs).sort((a, b) => {
    const latestDateA = new Date(
      Math.max(...a[1].map((ca) => new Date(ca.date).getTime()))
    );
    const latestDateB = new Date(
      Math.max(...b[1].map((ca) => new Date(ca.date).getTime()))
    );
    return latestDateB.getTime() - latestDateA.getTime();
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Corrective Actions</h2>
      <p className="mb-4 font-medium">
        Total Corrective Actions: {correctiveActions.length}
      </p>
      {sortedGroups.length === 0 ? (
        <p>No corrective actions found.</p>
      ) : (
        sortedGroups.map(([groupKey, groupCAs]) => {
          const [ruleType, ruleCode] = groupKey.split("-");
          return (
            <div key={groupKey} className="mb-8">
              <h3 className="text-lg font-semibold mb-2">{`${ruleType} - ${ruleCode}`}</h3>
              <ul className="space-y-4">
                {groupCAs
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .map((ca) => (
                    <CAItem
                      key={ca.id}
                      ca={ca}
                      rules={rules}
                      onEditCA={onEditCA}
                      onDeleteCA={onDeleteCA}
                      associateName={associate?.name || "Unknown"}
                      level={ca.level}
                    />
                  ))}
              </ul>
            </div>
          );
        })
      )}
    </div>
  );
};

export default CAList;
