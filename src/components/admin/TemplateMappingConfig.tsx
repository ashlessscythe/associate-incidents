import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import {
  getTemplateMappings,
  createOrUpdateTemplateMapping,
  deleteTemplateMapping,
  TemplateMapping,
} from "@/lib/templateApi";
import { Settings, Save, Trash2, Plus, X } from "lucide-react";

interface TemplateMappingConfigProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MappingFormData {
  dataPoint: string;
  cellValue: string;
  description: string;
}

const DEFAULT_MAPPINGS = {
  CA: [
    { dataPoint: "associateName", cellValue: "A7", description: "Associate name" },
    { dataPoint: "location", cellValue: "F7", description: "Location" },
    { dataPoint: "department", cellValue: "H7", description: "Department" },
    { dataPoint: "date", cellValue: "J7", description: "Date" },
    {
      dataPoint: "notificationLevels",
      cellValue: JSON.stringify(["B10", "E10", "H10", "B11", "E11"]),
      description: "Notification level cells (array)",
    },
    {
      dataPoint: "currentCA",
      cellValue: JSON.stringify({ appendixA: "B13", appendixB: "B14" }),
      description: "Current CA cells (object)",
    },
    { dataPoint: "description", cellValue: "A17", description: "CA description" },
    {
      dataPoint: "previousCAs",
      cellValue: JSON.stringify([
        { date: "B28", type: "D28", reason: "G28" },
        { date: "B29", type: "D29", reason: "G29" },
        { date: "B30", type: "D30", reason: "G30" },
      ]),
      description: "Previous CAs cells (array of objects)",
    },
  ],
  OCC: [
    { dataPoint: "associateName", cellValue: "A7", description: "Associate name" },
    { dataPoint: "location", cellValue: "F7", description: "Location" },
    { dataPoint: "department", cellValue: "H7", description: "Department" },
    { dataPoint: "date", cellValue: "J7", description: "Date" },
    {
      dataPoint: "notificationLevels",
      cellValue: JSON.stringify(["B9", "E9", "H9", "B10", "E10"]),
      description: "Notification level cells (array)",
    },
    { dataPoint: "misconductText", cellValue: "A14", description: "Misconduct text" },
    {
      dataPoint: "notifications",
      cellValue: JSON.stringify([
        { date: "B24", type: "D24", points: "G24" },
        { date: "B25", type: "D25", points: "G25" },
        { date: "B26", type: "D26", points: "G26" },
        { date: "B27", type: "D27", points: "G27" },
      ]),
      description: "Notifications cells (array of objects)",
    },
  ],
};

export default function TemplateMappingConfig({
  isOpen,
  onClose,
}: TemplateMappingConfigProps) {
  const [selectedTemplateType, setSelectedTemplateType] = useState<"CA" | "OCC">("CA");
  const [mappings, setMappings] = useState<TemplateMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMapping, setEditingMapping] = useState<string | null>(null);
  const [newMapping, setNewMapping] = useState<MappingFormData>({
    dataPoint: "",
    cellValue: "",
    description: "",
  });
  const [showNewForm, setShowNewForm] = useState(false);
  const [autoLoadedTypes, setAutoLoadedTypes] = useState<Set<"CA" | "OCC">>(new Set());

  useEffect(() => {
    if (isOpen) {
      // Auto-load defaults if no mappings exist for this template type and we haven't already tried
      const shouldAutoLoad = !autoLoadedTypes.has(selectedTemplateType);
      loadMappings(shouldAutoLoad).then((defaultsLoaded) => {
        if (defaultsLoaded) {
          setAutoLoadedTypes((prev) => new Set(prev).add(selectedTemplateType));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedTemplateType]);

  // Reset auto-loaded types when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAutoLoadedTypes(new Set());
    }
  }, [isOpen]);

  const loadMappings = async (autoLoadDefaults = false): Promise<boolean> => {
    setLoading(true);
    try {
      const data = await getTemplateMappings(selectedTemplateType);

      // Figure out which defaults are missing for this template type
      const defaults = DEFAULT_MAPPINGS[selectedTemplateType];
      const existingKeys = new Set(data.map((m) => m.dataPoint));
      const missingDefaults = defaults.filter(
        (mapping) => !existingKeys.has(mapping.dataPoint)
      );

      // If autoLoadDefaults is true and there are missing defaults, create just the missing ones
      if (autoLoadDefaults && missingDefaults.length > 0) {
        await Promise.all(
          missingDefaults.map((mapping) =>
            createOrUpdateTemplateMapping(
              selectedTemplateType,
              mapping.dataPoint,
              mapping.cellValue,
              mapping.description
            )
          )
        );

        // Reload mappings after creating missing defaults
        const updatedData = await getTemplateMappings(selectedTemplateType);
        setMappings(updatedData);
        toast.success("Default mappings loaded automatically");
        return true; // Indicates defaults were loaded
      }

      // No defaults loaded; just use what we have
      setMappings(data);
      return false;
    } catch {
      toast.error("Failed to load template mappings");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMapping = async (mapping: TemplateMapping) => {
    try {
      const cellValue = typeof mapping.cellValue === "string" 
        ? mapping.cellValue 
        : JSON.stringify(mapping.cellValue);
      
      await createOrUpdateTemplateMapping(
        mapping.templateType,
        mapping.dataPoint,
        cellValue,
        mapping.description
      );
      toast.success("Mapping saved successfully");
      setEditingMapping(null);
      loadMappings();
    } catch {
      toast.error("Failed to save mapping");
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mapping?")) return;

    try {
      await deleteTemplateMapping(id);
      toast.success("Mapping deleted successfully");
      loadMappings();
    } catch {
      toast.error("Failed to delete mapping");
    }
  };

  const handleCreateMapping = async () => {
    if (!newMapping.dataPoint || !newMapping.cellValue) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createOrUpdateTemplateMapping(
        selectedTemplateType,
        newMapping.dataPoint,
        newMapping.cellValue,
        newMapping.description
      );
      toast.success("Mapping created successfully");
      setNewMapping({ dataPoint: "", cellValue: "", description: "" });
      setShowNewForm(false);
      loadMappings();
    } catch {
      toast.error("Failed to create mapping");
    }
  };

  const handleLoadDefaults = async () => {
    if (!confirm("This will overwrite existing mappings with defaults. Continue?")) {
      return;
    }

    try {
      const defaults = DEFAULT_MAPPINGS[selectedTemplateType];
      await Promise.all(
        defaults.map((mapping) =>
          createOrUpdateTemplateMapping(
            selectedTemplateType,
            mapping.dataPoint,
            mapping.cellValue,
            mapping.description
          )
        )
      );
      toast.success("Default mappings loaded successfully");
      loadMappings();
    } catch {
      toast.error("Failed to load default mappings");
    }
  };

  const getMappingValue = (mapping: TemplateMapping): string => {
    try {
      const parsed = JSON.parse(mapping.cellValue);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return mapping.cellValue;
    }
  };

  const updateMappingCellValue = (id: string, newValue: string) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, cellValue: newValue } : m
      )
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Template Data Point to Cell Mapping Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Type Selector */}
          <div className="flex items-center gap-4">
            <Label htmlFor="templateType">Template Type:</Label>
            <Select
              value={selectedTemplateType}
              onValueChange={(value: "CA" | "OCC") => {
                setSelectedTemplateType(value);
                setEditingMapping(null);
                setShowNewForm(false);
              }}
            >
              <SelectTrigger id="templateType" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CA">Corrective Action (CA)</SelectItem>
                <SelectItem value="OCC">Occurrence (OCC)</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadDefaults}
              className="ml-auto"
            >
              Load Defaults
            </Button>
          </div>

          {/* Mappings List */}
          {loading ? (
            <div className="text-center py-8 text-foreground">Loading...</div>
          ) : (
            <div className="space-y-2">
              {mappings.map((mapping) => (
                <Card key={mapping.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="font-semibold">{mapping.dataPoint}</Label>
                        {mapping.description && (
                          <span className="text-sm text-muted-foreground">
                            - {mapping.description}
                          </span>
                        )}
                      </div>
                      {editingMapping === mapping.id ? (
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs">Cell Value (JSON):</Label>
                            <textarea
                              className="w-full p-2 border border-input bg-background text-foreground rounded text-sm font-mono placeholder:text-muted-foreground"
                              rows={4}
                              value={getMappingValue(mapping)}
                              onChange={(e) =>
                                updateMappingCellValue(mapping.id, e.target.value)
                              }
                              placeholder='e.g., "A7" or ["B9", "E9"] or {"date": "B24", "type": "D24"}'
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Description:</Label>
                            <Input
                              value={mapping.description || ""}
                              onChange={(e) =>
                                setMappings((prev) =>
                                  prev.map((m) =>
                                    m.id === mapping.id
                                      ? { ...m, description: e.target.value }
                                      : m
                                  )
                                )
                              }
                              placeholder="Optional description"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveMapping(mapping)}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingMapping(null);
                                loadMappings();
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm font-mono bg-muted text-foreground p-2 rounded">
                          {getMappingValue(mapping)}
                        </div>
                      )}
                    </div>
                    {editingMapping !== mapping.id && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingMapping(mapping.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteMapping(mapping.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}

              {mappings.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  No mappings found. Click "Add New Mapping" or "Load Defaults" to get started.
                </div>
              )}
            </div>
          )}

          {/* New Mapping Form */}
          {showNewForm && (
            <Card className="p-4 border-2 border-primary">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">New Mapping</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowNewForm(false);
                      setNewMapping({ dataPoint: "", cellValue: "", description: "" });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <Label>Data Point Name:</Label>
                  <Input
                    value={newMapping.dataPoint}
                    onChange={(e) =>
                      setNewMapping({ ...newMapping, dataPoint: e.target.value })
                    }
                    placeholder="e.g., associateName, location"
                  />
                </div>
                <div>
                  <Label>Cell Value (JSON):</Label>
                  <textarea
                    className="w-full p-2 border border-input bg-background text-foreground rounded text-sm font-mono placeholder:text-muted-foreground"
                    rows={4}
                    value={newMapping.cellValue}
                    onChange={(e) =>
                      setNewMapping({ ...newMapping, cellValue: e.target.value })
                    }
                    placeholder='e.g., "A7" or ["B9", "E9"] or {"date": "B24", "type": "D24"}'
                  />
                </div>
                <div>
                  <Label>Description (optional):</Label>
                  <Input
                    value={newMapping.description}
                    onChange={(e) =>
                      setNewMapping({ ...newMapping, description: e.target.value })
                    }
                    placeholder="Human-readable description"
                  />
                </div>
                <Button onClick={handleCreateMapping} className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Mapping
                </Button>
              </div>
            </Card>
          )}

          {!showNewForm && (
            <Button
              variant="outline"
              onClick={() => setShowNewForm(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Mapping
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

