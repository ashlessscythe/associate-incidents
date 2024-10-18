import React from "react";
import {
  Associate,
  AssociateInfo,
  CorrectiveAction,
  Rule,
  exportExcelCA,
} from "@/lib/api";
import { Printer, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import CAItem from "./CAItem";
import { useCAPrint } from "@/hooks/useCAPrint";
import { toast } from "react-hot-toast";

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

  // Count safety and operations CAs
  const safetyCumulativeCount = correctiveActions.filter((ca) => {
    const rule = rules.find((r) => r.id === ca.ruleId);
    return rule && (rule.type === "SAFETY" || rule.type === "OPERATIONS");
  }).length;

  const handleExport = async () => {
    try {
      const exportCAs = correctiveActions.filter((ca) => {
        const rule = rules.find((r) => r.id === ca.ruleId);
        return rule && (rule.type === "SAFETY" || rule.type === "OPERATIONS");
      });

      if (exportCAs.length === 0) {
        exportCAs.push(correctiveActions[0]); // If no safety/operations CAs, export the most recent one
      }

      // Remove file items from the corrective actions
      const exportCAsWithoutFiles = exportCAs.map((ca) => {
        const { files, ...caWithoutFiles } = ca;
        return caWithoutFiles;
      });

      const blob = await exportExcelCA(
        associate.name,
        associate.location?.name || "",
        associate.department?.name || "",
        new Date().toISOString().split("T")[0],
        exportCAsWithoutFiles,
        "Multiple Corrective Actions" // You might want to adjust this based on your needs
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${associate.name}_corrective_actions.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error(
        "An error occurred while exporting to Excel. Please try again."
      );
    }
  };

  return (
    <div className="mt-6 flex flex-col md:flex-row">
      <div className="w-full">
        <h2 className="text-2xl font-semibold mb-4">Corrective Actions</h2>
        {/* Updated Summary Section */}
        <div className="bg-muted p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold mb-2">Associate Summary</h3>
          <div className="grid grid-cols-2 gap-2">
            <p>
              <span className="font-medium">Name:</span>{" "}
              {associate?.name || "N/A"}
            </p>
            <p>
              <span className="font-medium">Department:</span>{" "}
              {associate?.department?.name || "N/A"}
            </p>
            <p>
              <span className="font-medium">Location:</span>{" "}
              {associate?.location?.name || "N/A"}
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <p className="mb-4 font-medium">
            Total Corrective Actions: {correctiveActions.length}
            <br />
            Cumulative Count: {safetyCumulativeCount}
          </p>
          <div>
            <Button
              onClick={() =>
                handlePrint({
                  associate,
                  correctiveActions,
                  totalCorrectiveActions: correctiveActions.length,
                  safetyCumulativeCount,
                })
              }
              variant="outline"
              size="icon"
              className="mr-2"
              aria-label="Print corrective actions"
            >
              <Printer size={20} />
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              size="icon"
              aria-label="Export corrective actions to Excel"
            >
              <FileSpreadsheet size={20} />
            </Button>
          </div>
        </div>
        {sortedGroups.length === 0 ? (
          <p className="text-muted-foreground">No corrective actions found.</p>
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
