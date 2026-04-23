import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Printer,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  Trash2,
  Pencil,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  getAssociatePointsAndNotification,
  deleteOccurrence,
  updateOccurrence,
  AssociateInfo,
  exportExcelOcc,
  recordOccExport,
  getLocations,
  getDepartments,
  Location,
  Department,
  getNotifications,
  Notification,
  Occurrence,
  uploadOccurrenceFile,
  downloadFile,
  deleteFile,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useOccurrencePrint } from "@/hooks/useOccurrencePrint";
import OccurrenceItem from "./OccurrenceItem";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { isOverOneYearOld } from "@/lib/dateUtils";

interface OccurrenceType {
  id: string;
  code: string;
  description: string;
  points: number;
}

interface OccurrenceListProps {
  occurrences?: Occurrence[];
  associateInfo: AssociateInfo;
  onDelete: (occurrenceId: string) => void;
  onUpdate: (occurenceId: string) => void;
  occurrenceTypes: OccurrenceType[];
  allowEdit?: boolean;
}

type SortColumn = "type" | "description" | "date" | "points";
type SortDirection = "asc" | "desc";

const OccurrenceList: React.FC<OccurrenceListProps> = ({
  occurrences,
  associateInfo,
  onUpdate,
  onDelete,
  occurrenceTypes,
  allowEdit,
}) => {
  const { user } = useAuth();
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [occurrenceSubtotal, setOccurrenceSubtotal] = useState<number | null>(
    null
  );
  const [manualAdjustment, setManualAdjustment] = useState<number | null>(null);
  const [notificationLevel, setNotificationLevel] = useState<string>("None");
  const [designation, setDesignation] = useState<string>("");
  const [editingOccurrence, setEditingOccurrence] = useState<Occurrence | null>(
    null
  );
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportLocation, setExportLocation] = useState("");
  const [exportDepartment, setExportDepartment] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const [hideZeroPoints, setHideZeroPoints] = useState<boolean>(false);
  const [hideOldOccurrences, setHideOldOccurrences] = useState<boolean>(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [associateLocation, setAssociateLocation] = useState<Location | null>(
    null
  );
  const [associateDepartment, setAssociateDepartment] =
    useState<Department | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const handlePrint = useOccurrencePrint();

  const hasEditorRole =
    user && Array.isArray(user.roles) && user.roles.includes("att-edit");

  const showEditActions = allowEdit !== undefined ? allowEdit : hasEditorRole;

  const handleDelete = async (occurrenceId: string) => {
    const isConfirmed = window.confirm("Are you sure you want to delete?");

    if (!isConfirmed) {
      return;
    }
    try {
      await deleteOccurrence(occurrenceId);
      onDelete(occurrenceId);
    } catch (err) {
      console.error("Error deleting occurrence:", err);
      if (err instanceof Error) {
        alert(`Failed to delete occurrence: ${err.message}`);
      } else {
        alert("An unknown error occurred while deleting the occurrence");
      }
    }
  };

  const handleUpdateOccurrence = async (
    occurrenceId: string,
    occurrenceData: {
      typeId?: string;
      date?: Date;
      notes?: string;
    }
  ) => {
    try {
      await updateOccurrence(occurrenceId, occurrenceData);

      if (associateInfo.id) {
        onUpdate(associateInfo.id);
      }
    } catch (err) {
      if (err instanceof Error) {
        alert(`Failed to update occurrence: ${err.message}`);
      } else {
        alert("An unknown error occurred while updating occurrence");
      }
    }
  };

  const handleUploadFile = async (occurrenceId: string, file: File) => {
    try {
      await uploadOccurrenceFile(occurrenceId, file);
      if (associateInfo.id) {
        onUpdate(associateInfo.id);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file. Please try again.");
    }
  };

  const handleDownloadFile = async (fileId: string, filename: string) => {
    try {
      const blob = await downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file. Please try again.");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      if (associateInfo.id) {
        onUpdate(associateInfo.id);
      }
      toast.success("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file. Please try again.");
    }
  };

  useEffect(() => {
    const fetchLocationsAndDepartments = async () => {
      try {
        const [locationsData, departmentsData] = await Promise.all([
          getLocations(),
          getDepartments(),
        ]);
        setLocations(locationsData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error("Error fetching locations and departments:", error);
      }
    };

    fetchLocationsAndDepartments();
  }, []);

  useEffect(() => {
    const fetchPointsAndNotification = async () => {
      if (associateInfo.id) {
        try {
          const [
            {
              points,
              occurrencePoints,
              pointsAdjustment,
              notificationLevel,
              designation,
              location,
              department,
            },
            notificationsData,
          ] = await Promise.all([
            getAssociatePointsAndNotification(associateInfo.id),
            getNotifications(associateInfo.id, "OCCURRENCE"),
          ]);
          setTotalPoints(points);
          setOccurrenceSubtotal(
            occurrencePoints !== undefined ? occurrencePoints : null
          );
          setManualAdjustment(
            pointsAdjustment !== undefined ? pointsAdjustment : null
          );
          setNotificationLevel(notificationLevel);
          setDesignation(designation);
          if (location) {
            setAssociateLocation(location);
          }
          if (department) {
            setAssociateDepartment(department);
          }
          setNotifications(notificationsData);
        } catch (e) {
          console.error("Error fetching associate data:", e);
        }
      }
    };

    fetchPointsAndNotification();
  }, [associateInfo.id, occurrences]);

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedOccurrences = [...(occurrences || [])].sort((a, b) => {
    let comparison = 0;
    switch (sortColumn) {
      case "type":
        comparison = a.type.code.localeCompare(b.type.code);
        break;
      case "description":
        comparison = a.type.description.localeCompare(b.type.description);
        break;
      case "date":
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case "points":
        comparison = a.type.points - b.type.points;
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const rollupYearStart = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }, []);

  const resolvedEffectiveYmd = useMemo(() => {
    const raw =
      associateInfo?.pointTotalsEffectiveDate ??
      associateInfo?.designationPointTotalsEffectiveDate ??
      null;
    return raw ? new Date(raw) : null;
  }, [
    associateInfo?.pointTotalsEffectiveDate,
    associateInfo?.designationPointTotalsEffectiveDate,
  ]);

  /** Same row set as the table; print/export use `docRollup` derived from this. */
  const visibleSortedOccurrences = useMemo(
    () =>
      sortedOccurrences.filter((occurrence) => {
        if (hideZeroPoints && occurrence.type.points === 0) return false;
        if (hideOldOccurrences && isOverOneYearOld(occurrence.date))
          return false;
        return true;
      }),
    [sortedOccurrences, hideZeroPoints, hideOldOccurrences]
  );

  const docRollup = useMemo(() => {
    const counted: Occurrence[] = [];
    const prior: Occurrence[] = [];
    const outside: Occurrence[] = [];
    const eff = resolvedEffectiveYmd;
    for (const occ of visibleSortedOccurrences) {
      const d = new Date(occ.date);
      if (d < rollupYearStart) outside.push(occ);
      else if (eff && d < eff) prior.push(occ);
      else counted.push(occ);
    }
    return { counted, prior, outside };
  }, [visibleSortedOccurrences, resolvedEffectiveYmd, rollupYearStart]);

  const rowsWithVariant = useMemo(() => {
    const eff = resolvedEffectiveYmd;
    return visibleSortedOccurrences.map((occ) => {
      const d = new Date(occ.date);
      let variant: "counted" | "prior" | "outside";
      if (d < rollupYearStart) variant = "outside";
      else if (eff && d < eff) variant = "prior";
      else variant = "counted";
      return { occ, variant };
    });
  }, [visibleSortedOccurrences, resolvedEffectiveYmd, rollupYearStart]);

  const sectionTitle = (variant: "counted" | "prior" | "outside") => {
    if (variant === "counted")
      return "Counted toward current total (rolling window)";
    if (variant === "prior")
      return "Prior in rolling window (not counted toward current total)";
    return "Outside rolling 12-month window (not in totals)";
  };

  const renderSortIcon = (column: SortColumn) => {
    if (column === sortColumn) {
      return sortDirection === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-2 h-4 w-4" />
      );
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  const handleExcelExport = async () => {
    if (!associateLocation && !associateDepartment) {
      alert(
        "Both location and department are missing. Please update the associate's information before exporting."
      );
      return;
    }

    if (!associateLocation || !associateDepartment) {
      setExportLocation(associateLocation?.name || "");
      setExportDepartment(associateDepartment?.name || "");
      setIsExportModalOpen(true);
    } else {
      await executeExcelExport(
        associateDepartment.name,
        associateLocation.name
      );
    }
  };

  const executeExcelExport = async (department: string, location: string) => {
    try {
      const currentDate = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(currentDate.getFullYear() - 1);

      // Filter notifications within the date range and remove file items
      const notificationsWithoutFiles = notifications
        .filter((notification) => {
          const notificationDate = new Date(notification.date);
          return (
            notificationDate >= oneYearAgo && notificationDate <= currentDate
          );
        })
        .map((notification) => {
          const { files, ...notificationWithoutFiles } = notification;
          return notificationWithoutFiles;
        });

      const currentDateStr = currentDate.toISOString().split("T")[0];

      const blob = await exportExcelOcc(
        associateInfo.name,
        location,
        department,
        currentDateStr,
        docRollup.counted,
        docRollup.prior,
        docRollup.outside,
        notificationLevel,
        notificationsWithoutFiles,
        designation
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${associateInfo.name}_occurrences.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      const exportedBy =
        user?.name || "no name";
      const exportedAt = new Date();

      await recordOccExport(
        associateInfo.id,
        exportedBy,
        exportedAt,
        location,
        department
      );

      setIsExportModalOpen(false);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("An error occurred while exporting to Excel. Please try again.");
    }
  };

  return (
    <div className="mt-6 flex flex-col md:flex-row">
      <div className="w-full">
        <h2 className="text-xl font-semibold mb-2">Occurrence List</h2>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div className="w-full md:w-1/2 mb-4 md:mb-0">
            <h3 className="text-xl font-semibold mb-2">
              Summary for: {associateInfo.name}
            </h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <p
                className={cn(
                  "font-semibold text-gray-800 dark:text-gray-200",
                  totalPoints < 0 && "text-destructive dark:text-destructive"
                )}
              >
                Total Points (last 12 months): {totalPoints}
              </p>
              {manualAdjustment !== null &&
                manualAdjustment !== 0 &&
                occurrenceSubtotal !== null && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span
                      className={cn(
                        occurrenceSubtotal < 0 && "text-destructive font-medium"
                      )}
                    >
                      Occurrence subtotal: {occurrenceSubtotal}
                    </span>
                    {" · "}
                    <span
                      className={cn(
                        manualAdjustment < 0 && "text-destructive font-medium"
                      )}
                    >
                      Manual adjustment: {manualAdjustment > 0 ? "+" : ""}
                      {manualAdjustment}
                    </span>
                  </p>
                )}
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                Current Notification Level: {notificationLevel}
              </p>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                Designation: {designation}
              </p>
              {associateInfo?.resolvedPointTotalsEffectiveDate && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Cutoff applied (inclusive):{" "}
                  {new Date(associateInfo.resolvedPointTotalsEffectiveDate)
                    .toISOString()
                    .split("T")[0]}
                  {associateInfo.pointTotalsEffectiveDate
                    ? " (associate override)"
                    : associateInfo.designationPointTotalsEffectiveDate
                      ? " (designation default)"
                      : ""}
                  {associateInfo?.priorOccurrencePoints != null &&
                    associateInfo.priorOccurrencePoints > 0 && (
                      <>
                        {" "}
                        · Prior in window (excluded):{" "}
                        {associateInfo.priorOccurrencePoints} pts
                      </>
                    )}
                </p>
              )}
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                Location: {associateLocation?.name || "Not set"}
              </p>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                Department: {associateDepartment?.name || "Not set"}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="hide-zero-points"
                checked={hideZeroPoints}
                onCheckedChange={setHideZeroPoints}
              />
              <Label htmlFor="hide-zero-points">Hide Zero</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="hide-old-occurrences"
                checked={hideOldOccurrences}
                onCheckedChange={setHideOldOccurrences}
              />
              <Label htmlFor="hide-old-occurrences">Hide Old</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="view-mode"
                checked={viewMode === "cards"}
                onCheckedChange={(checked) =>
                  setViewMode(checked ? "cards" : "table")
                }
              />
              <Label htmlFor="view-mode">Card View</Label>
            </div>
          </div>
        </div>

        {occurrences && (
          <div className="flex justify-end mb-4">
            <Button
              onClick={() =>
                handlePrint({
                  associateInfo,
                  occurrenceSubtotal: occurrenceSubtotal ?? 0,
                  pointsAdjustment: manualAdjustment ?? 0,
                  totalPoints,
                  notificationLevel,
                  designation,
                  filteredCountedOccurrences: docRollup.counted,
                  filteredPriorOccurrences: docRollup.prior,
                  filteredOutsideOccurrences: docRollup.outside,
                })
              }
              className="text-light-500 hover:text-light-700 mr-2"
              variant="ghost"
              size="icon"
              aria-label="Print occurrence list"
            >
              <Printer size={20} />
            </Button>
            <Button
              onClick={handleExcelExport}
              className="text-light-500 hover:text-light-700 mr-2"
              variant="ghost"
              size="icon"
              aria-label="Export to Excel"
            >
              <FileSpreadsheet size={20} />
            </Button>
          </div>
        )}

        {viewMode === "table" ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">
                    <Button variant="ghost" onClick={() => handleSort("type")}>
                      Type {renderSortIcon("type")}
                    </Button>
                  </TableHead>
                  <TableHead className="w-64">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("description")}
                    >
                      Description {renderSortIcon("description")}
                    </Button>
                  </TableHead>
                  <TableHead className="w-32">
                    <Button variant="ghost" onClick={() => handleSort("date")}>
                      Date {renderSortIcon("date")}
                    </Button>
                  </TableHead>
                  <TableHead className="w-64">Notes</TableHead>
                  <TableHead className="w-24">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("points")}
                    >
                      Points {renderSortIcon("points")}
                    </Button>
                  </TableHead>
                  {showEditActions && (
                    <TableHead className="w-32">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsWithVariant.map(({ occ: occurrence, variant }, idx) => {
                  const prev = rowsWithVariant[idx - 1];
                  const showSection =
                    !!associateInfo?.resolvedPointTotalsEffectiveDate &&
                    (!prev || prev.variant !== variant);
                  const isOld = variant === "outside";
                  const rowStyle =
                    isOld || variant === "prior"
                      ? {
                          color: variant === "prior" ? undefined : "gray",
                          textDecoration:
                            variant === "outside" ? "line-through" : undefined,
                          opacity: variant === "prior" ? 0.85 : undefined,
                        }
                      : {};

                  return (
                    <React.Fragment key={occurrence.id}>
                      {showSection && (
                        <TableRow className="bg-muted/80 hover:bg-muted/80">
                          <TableCell
                            colSpan={showEditActions ? 6 : 5}
                            className="font-semibold text-sm py-2"
                          >
                            {sectionTitle(variant)}
                          </TableCell>
                        </TableRow>
                      )}
                    <TableRow style={rowStyle}>
                      <TableCell className="w-24">
                        {occurrence.type.code}
                        {occurrence.files && occurrence.files.length > 0 && (
                          <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
                            {occurrence.files.length}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="w-64">
                        {occurrence.type.description}
                      </TableCell>
                      <TableCell className="w-32">
                        {new Date(occurrence.date).toISOString().split("T")[0]}
                      </TableCell>
                      <TableCell className="w-64 whitespace-normal break-words">
                        {occurrence.notes}
                      </TableCell>
                      <TableCell className="w-24">
                        {occurrence.type.points}
                        {isOld && (
                          <span className="ml-2 text-sm text-gray-500">
                            (rolled out)
                          </span>
                        )}
                        {variant === "prior" && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            (not counted)
                          </span>
                        )}
                      </TableCell>
                      {showEditActions && (
                        <TableCell className="w-32">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(occurrence.id)}
                            aria-label="Delete occurrence"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingOccurrence(occurrence)}
                            aria-label="Edit occurrence"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = ".pdf,.doc,.docx,.txt";
                              input.onchange = async (e) => {
                                const file = (e.target as HTMLInputElement)
                                  .files?.[0];
                                if (file) {
                                  if (file.size > 1024 * 1024) {
                                    toast.error(
                                      "File size exceeds 1MB limit. Please choose a smaller file."
                                    );
                                    return;
                                  }
                                  try {
                                    await handleUploadFile(occurrence.id, file);
                                    toast.success("File uploaded successfully");
                                  } catch (error) {
                                    console.error(
                                      "Error uploading file:",
                                      error
                                    );
                                    toast.error(
                                      "Failed to upload file. Please try again."
                                    );
                                  }
                                }
                              };
                              input.click();
                            }}
                            aria-label="Upload file"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <ul className="space-y-4">
            {rowsWithVariant.map(({ occ: occurrence }) => (
              <OccurrenceItem
                key={occurrence.id}
                occurrence={occurrence}
                occurrenceTypes={occurrenceTypes}
                associateInfo={associateInfo}
                onEdit={setEditingOccurrence}
                onDelete={handleDelete}
                onUploadFile={handleUploadFile}
                onDownloadFile={handleDownloadFile}
                onDeleteFile={handleDeleteFile}
              />
            ))}
          </ul>
        )}

        {rowsWithVariant.length === 0 && (
          <p className="text-center text-gray-500 mt-4">
            No occurrences recorded
          </p>
        )}
      </div>

      {/* Export Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export to Excel</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Select value={exportLocation} onValueChange={setExportLocation}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.name}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Select
                value={exportDepartment}
                onValueChange={setExportDepartment}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.name}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                executeExcelExport(exportDepartment, exportLocation)
              }
              disabled={!exportLocation || !exportDepartment}
            >
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editingOccurrence && (
        <Dialog
          open={!!editingOccurrence}
          onOpenChange={() => setEditingOccurrence(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Occurrence</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateOccurrence(editingOccurrence.id, {
                  typeId: editingOccurrence.type.id,
                  date: editingOccurrence.date,
                  notes: editingOccurrence.notes,
                });
                setEditingOccurrence(null);
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select
                    value={editingOccurrence.type.id}
                    onValueChange={(value) =>
                      setEditingOccurrence({
                        ...editingOccurrence,
                        type:
                          occurrenceTypes.find((type) => type.id === value) ||
                          editingOccurrence.type,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      {occurrenceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={
                      new Date(editingOccurrence.date)
                        .toISOString()
                        .split("T")[0]
                    }
                    onChange={(e) =>
                      setEditingOccurrence({
                        ...editingOccurrence,
                        date: new Date(e.target.value),
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={editingOccurrence.notes}
                    onChange={(e) =>
                      setEditingOccurrence({
                        ...editingOccurrence,
                        notes: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default OccurrenceList;
