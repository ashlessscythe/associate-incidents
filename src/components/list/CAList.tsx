import React from "react";
import { Associate, AssociateInfo, CorrectiveAction, Rule } from "@/lib/api";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import CAItem from "./CAItem";
import { useCAPrint } from "@/hooks/useCAPrint";

interface CAListProps {
  associate: Associate;
  associateInfo: AssociateInfo;
  correctiveActions: CorrectiveAction[];
  rules: Rule[];
  onEditCA?: (ca: CorrectiveAction) => void;
  onDeleteCA?: (id: string) => Promise<void>;
  onUploadFile?: (caId: string, file: File) => Promise<void>;
  onDownloadFile?: (fileId: string, filename: string) => Promise<void>;
  onDeleteFile?: (fileId: string) => Promise<void>;
}

const CAList: React.FC<CAListProps> = ({
  associate,
  associateInfo,
  correctiveActions,
  rules,
  onEditCA,
  onDeleteCA,
  onUploadFile,
  onDownloadFile,
  onDeleteFile,
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

  const handlePrint = useCAPrint();

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
    <div className="mt-6 flex flex-col md:flex-row">
      <div className="w-full">
        <h2 className="text-xl font-semibold mb-2">Corrective Actions</h2>
        {/* New Summary Section */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold mb-2">Associate Summary</h3>
          <div className="grid grid-cols-2 gap-2">
            <p>
              <strong>Name:</strong> {associate?.name || "N/A"}
            </p>
            <p>
              <strong>Department:</strong>{" "}
              {associate?.department?.name || "N/A"}
            </p>
            <p>
              <strong>Location:</strong> {associate?.location?.name || "N/A"}
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <p className="mb-4 font-medium">
            Total Corrective Actions: {correctiveActions.length}
            <Button
              onClick={() => handlePrint({ associate, correctiveActions })}
              className="text-blue-500 hover:text-blue-700"
              variant="ghost"
              size="icon"
              aria-label="Print corrective action"
            >
              <Printer size={20} />
            </Button>
          </p>
        </div>
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
                        onUploadFile={onUploadFile}
                        onDownloadFile={onDownloadFile}
                        onDeleteFile={onDeleteFile}
                        associate={associate}
                        associateInfo={associateInfo}
                        level={ca.level}
                        associateLocation={associate?.location?.name}
                        associateDepartment={associate?.department?.name}
                      />
                    ))}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CAList;
