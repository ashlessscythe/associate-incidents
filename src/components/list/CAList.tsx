import React, { useState } from "react";
import {
  Associate,
  AssociateInfo,
  CorrectiveAction,
  Rule,
  exportExcelCA,
} from "@/lib/api";
import { Printer, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import CAItem from "./CAItem";
import { useCAPrint } from "@/hooks/useCAPrint";
import { toast } from "react-hot-toast";
import { omitFiles } from "@/lib/exportPayload";

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
  // Get unique rule types
  const ruleTypes = Array.from(new Set(rules.map((rule) => rule.type)));

  // Initialize state for rule type filters - all enabled by default
  const [enabledRuleTypes, setEnabledRuleTypes] = useState<
    Record<string, boolean>
  >(ruleTypes.reduce((acc, type) => ({ ...acc, [type]: true }), {}));

  // Filter CAs by enabled rule types
  const filteredCAs = correctiveActions.filter((ca) => {
    const rule = rules.find((r) => r.id === ca.ruleId);
    return rule && enabledRuleTypes[rule.type];
  });

  // Group CAs by rule type and code
  const groupedCAs = filteredCAs.reduce((acc, ca) => {
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

  // Count safety and operations CAs from filtered CAs, respecting current filter settings
  const safetyCumulativeCount = filteredCAs.filter((ca) => {
    const rule = rules.find((r) => r.id === ca.ruleId);
    // Only count types that are currently enabled in the filter
    return (
      rule &&
      ((rule.type === "SAFETY" && enabledRuleTypes["SAFETY"]) ||
        (rule.type === "OPERATIONS" && enabledRuleTypes["OPERATIONS"]))
    );
  }).length;

  const handleExport = async () => {
    try {
      const exportCAs = filteredCAs.filter((ca) => {
        const rule = rules.find((r) => r.id === ca.ruleId);
        return (
          rule &&
          ((rule.type === "SAFETY" && enabledRuleTypes["SAFETY"]) ||
            (rule.type === "OPERATIONS" && enabledRuleTypes["OPERATIONS"]))
        );
      });

      if (exportCAs.length === 0 && filteredCAs.length > 0) {
        exportCAs.push(filteredCAs[0]); // If no safety/operations CAs, export the most recent filtered one
      }

      // Remove file items from the corrective actions
      const exportCAsWithoutFiles = exportCAs.map((ca) => {
        return omitFiles(ca);
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div className="w-full md:w-1/3">
              <h3 className="text-lg font-semibold mb-2">Associate Summary</h3>
              <div className="grid gap-2">
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

            <div className="w-full md:w-1/3 mt-4 md:mt-0">
              <h3 className="text-lg font-semibold mb-2">Filters</h3>
              <div className="grid gap-2">
                {ruleTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Switch
                      id={`filter-${type.toLowerCase()}`}
                      checked={enabledRuleTypes[type]}
                      onCheckedChange={(checked) =>
                        setEnabledRuleTypes((prev) => ({
                          ...prev,
                          [type]: checked,
                        }))
                      }
                    />
                    <Label htmlFor={`filter-${type.toLowerCase()}`}>
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-1/3 mt-4 md:mt-0">
              <h3 className="text-lg font-semibold mb-2">Statistics</h3>
              <div className="grid gap-2">
                <p>
                  <span className="font-medium">Total Corrective Actions:</span>{" "}
                  {correctiveActions.length}
                </p>
                <p>
                  <span className="font-medium">
                    Filtered Corrective Actions:
                  </span>{" "}
                  {filteredCAs.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <Button
            onClick={() =>
              handlePrint({
                associate,
                correctiveActions: filteredCAs,
                totalCorrectiveActions: filteredCAs.length,
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

        {sortedGroups.length === 0 ? (
          <p className="text-muted-foreground">No corrective actions found.</p>
        ) : (
          sortedGroups.map(([groupKey, groupCAs]) => {
            const [ruleType, ruleCode] = groupKey.split("-");
            return (
              <div key={groupKey} className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">{`${ruleType} - ${ruleCode}`}</h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        handlePrint({
                          associate,
                          correctiveActions: groupCAs,
                          totalCorrectiveActions: groupCAs.length,
                          safetyCumulativeCount: groupCAs.filter((ca) => {
                            const rule = rules.find((r) => r.id === ca.ruleId);
                            return (
                              rule &&
                              ((rule.type === "SAFETY" &&
                                enabledRuleTypes["SAFETY"]) ||
                                (rule.type === "OPERATIONS" &&
                                  enabledRuleTypes["OPERATIONS"]))
                            );
                          }).length,
                        })
                      }
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={`Print ${ruleType} - ${ruleCode} corrective actions`}
                    >
                      <Printer size={16} />
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          const exportCAsWithoutFiles = groupCAs.map((ca) => {
                            return omitFiles(ca);
                          });

                          const blob = await exportExcelCA(
                            associate.name,
                            associate.location?.name || "",
                            associate.department?.name || "",
                            new Date().toISOString().split("T")[0],
                            exportCAsWithoutFiles,
                            `${ruleType} - ${ruleCode}`
                          );

                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.style.display = "none";
                          a.href = url;
                          a.download = `${associate.name}_${ruleType}_${ruleCode}_corrective_actions.xlsx`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                        } catch (error) {
                          console.error("Error exporting to Excel:", error);
                          toast.error(
                            "An error occurred while exporting to Excel. Please try again."
                          );
                        }
                      }}
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={`Export ${ruleType} - ${ruleCode} corrective actions to Excel`}
                    >
                      <FileSpreadsheet size={16} />
                    </Button>
                  </div>
                </div>
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
