import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trash2,
  Pencil,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  Filter,
} from "lucide-react";
import {
  AssociateAndDesignation,
  Department,
  Location,
} from "@/lib/api";
import { Designation } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type SortOrder = "asc" | "desc";

interface AssociatesTableProps {
  associates: AssociateAndDesignation[];
  departments: Department[];
  locations: Location[];
  onDelete: (id: string) => void;
  onEdit: (
    id: string,
    name: string,
    departmentId: string,
    designation: string,
    location: string
  ) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  hasEditorRole: boolean;
  onOpenPointsAdjustment?: (associate: AssociateAndDesignation) => void;
}

type SortKey = "name" | "department" | "designation" | "location";

/** Sentinel for "no filter" in Select (Radix disallows empty string values). */
const FILTER_ALL = "__all__";

const AssociatesTable: React.FC<AssociatesTableProps> = ({
  associates,
  departments,
  locations,
  onDelete,
  onEdit,
  onToggleActive,
  hasEditorRole,
  onOpenPointsAdjustment,
}) => {
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingAssociate, setEditingAssociate] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState(FILTER_ALL);
  const [filterDesignation, setFilterDesignation] = useState(FILTER_ALL);
  const [filterLocationId, setFilterLocationId] = useState(FILTER_ALL);
  const [filterActive, setFilterActive] = useState(FILTER_ALL);

  const designationOptions = useMemo(() => {
    const set = new Set<string>();
    for (const a of associates) {
      if (a.designation) set.add(a.designation);
    }
    for (const d of Object.values(Designation)) set.add(d);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [associates]);

  const sortedDepartments = useMemo(
    () => [...departments].sort((a, b) => a.name.localeCompare(b.name)),
    [departments]
  );
  const sortedLocations = useMemo(
    () => [...locations].sort((a, b) => a.name.localeCompare(b.name)),
    [locations]
  );

  const filtersAreDefault =
    searchTerm === "" &&
    filterDepartmentId === FILTER_ALL &&
    filterDesignation === FILTER_ALL &&
    filterLocationId === FILTER_ALL &&
    filterActive === FILTER_ALL;

  const clearFilters = () => {
    setSearchTerm("");
    setFilterDepartmentId(FILTER_ALL);
    setFilterDesignation(FILTER_ALL);
    setFilterLocationId(FILTER_ALL);
    setFilterActive(FILTER_ALL);
  };

  const handleDeleteClick = (id: string) => {
    setConfirmingDelete(id);
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      await onDelete(id);
      setConfirmingDelete(null);
    } catch (error) {
      console.error("Failed to delete associate:", error);
      setErrorMessage("Failed to delete associate. Please try again.");
    }
  };

  const handleEditClick = (associate: AssociateAndDesignation) => {
    if (!hasEditorRole) return;
    setEditingAssociate(associate.id);
    setEditName(associate.name);
    setEditDepartmentId(associate.department?.id || "");
    setEditDesignation(associate.designation || "");
    setEditLocation(associate.location?.id || "");
  };

  const handleSaveEdit = async (id: string) => {
    if (!hasEditorRole) return;
    
    try {
      await onEdit(id, editName, editDepartmentId, editDesignation, editLocation);
      setEditingAssociate(null);
    } catch (error) {
      console.error("Error updating associate:", error);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const filteredAndSortedAssociates = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return associates
      .filter((associate) => {
        if (filterDepartmentId !== FILTER_ALL) {
          if (associate.department?.id !== filterDepartmentId) return false;
        }
        if (filterDesignation !== FILTER_ALL) {
          if (associate.designation !== filterDesignation) return false;
        }
        if (filterLocationId !== FILTER_ALL) {
          if (associate.location?.id !== filterLocationId) return false;
        }
        if (filterActive === "active" && !associate.isActive) return false;
        if (filterActive === "inactive" && associate.isActive) return false;

        if (!q) return true;
        return (
          associate.name.toLowerCase().includes(q) ||
          (associate.department?.name || "").toLowerCase().includes(q) ||
          (associate.designation || "").toLowerCase().includes(q) ||
          (associate.location?.name || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortKey === "name") {
          return sortOrder === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else if (sortKey === "department") {
          return sortOrder === "asc"
            ? (a.department?.name || "").localeCompare(b.department?.name || "")
            : (b.department?.name || "").localeCompare(a.department?.name || "");
        } else if (sortKey === "designation") {
          return sortOrder === "asc"
            ? (a.designation || "").localeCompare(b.designation || "")
            : (b.designation || "").localeCompare(a.designation || "");
        } else {
          // location
          return sortOrder === "asc"
            ? (a.location?.name || "").localeCompare(b.location?.name || "")
            : (b.location?.name || "").localeCompare(a.location?.name || "");
        }
      });
  }, [
    associates,
    searchTerm,
    sortKey,
    sortOrder,
    filterDepartmentId,
    filterDesignation,
    filterLocationId,
    filterActive,
  ]);

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="inline w-4 h-4" />
    ) : (
      <ChevronDown className="inline w-4 h-4" />
    );
  };

  return (
    <div>
      <Card className="mb-4 border-border/80 shadow-sm">
        <CardHeader className="space-y-1 pb-4 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2 font-semibold tracking-tight">
            <Filter className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            Search & filters
          </CardTitle>
          <CardDescription>
            Search by text, then narrow the table by department, designation,
            location, or active status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div>
            <Label htmlFor="associate-search" className="sr-only">
              Search associates
            </Label>
            <Input
              id="associate-search"
              type="search"
              placeholder="Search by name, department, designation, location…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="filter-dept">Department</Label>
              <Select
                value={filterDepartmentId}
                onValueChange={setFilterDepartmentId}
              >
                <SelectTrigger
                  id="filter-dept"
                  className="w-full bg-background"
                >
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>All departments</SelectItem>
                  {sortedDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-designation">Designation</Label>
              <Select
                value={filterDesignation}
                onValueChange={setFilterDesignation}
              >
                <SelectTrigger
                  id="filter-designation"
                  className="w-full bg-background"
                >
                  <SelectValue placeholder="All designations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>All designations</SelectItem>
                  {designationOptions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-location">Location</Label>
              <Select
                value={filterLocationId}
                onValueChange={setFilterLocationId}
              >
                <SelectTrigger
                  id="filter-location"
                  className="w-full bg-background"
                >
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>All locations</SelectItem>
                  {sortedLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-active">Status</Label>
              <Select value={filterActive} onValueChange={setFilterActive}>
                <SelectTrigger
                  id="filter-active"
                  className="w-full bg-background"
                >
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>All</SelectItem>
                  <SelectItem value="active">Active only</SelectItem>
                  <SelectItem value="inactive">Inactive only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground tabular-nums">
              Showing{" "}
              <span className="font-medium text-foreground">
                {filteredAndSortedAssociates.length}
              </span>{" "}
              of {associates.length} associate
              {associates.length === 1 ? "" : "s"}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full shrink-0 sm:w-auto"
              onClick={clearFilters}
              disabled={filtersAreDefault}
            >
              Clear all
            </Button>
          </div>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("name")}
            >
              Name <SortIcon columnKey="name" />
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("department")}
            >
              Department <SortIcon columnKey="department" />
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("designation")}
            >
              Designation <SortIcon columnKey="designation" />
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("location")}
            >
              Location <SortIcon columnKey="location" />
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Points (12 mo)</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedAssociates.map((associate) => (
            <TableRow key={associate.id}>
              <TableCell>
                {editingAssociate === associate.id ? (
                  <Input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                ) : (
                  <>
                    <Link
                      to={`/attendance?associateId=${associate.id}`}
                      className="text-primary hover:text-primary/80 mr-2"
                    >
                      {associate.name}
                    </Link>
                    <Link
                      to={`/ca?associateId=${associate.id}`}
                      className="text-secondary hover:text-secondary/80"
                    >
                      (CA)
                    </Link>
                  </>
                )}
              </TableCell>
              <TableCell>
                {editingAssociate === associate.id ? (
                  <Select
                    value={editDepartmentId}
                    onValueChange={(value) => setEditDepartmentId(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  associate.department?.name || "-"
                )}
              </TableCell>
              <TableCell>
                {editingAssociate === associate.id ? (
                  <Select
                    value={editDesignation}
                    onValueChange={(value) => setEditDesignation(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select a designation" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Designation).map((designation) => (
                        <SelectItem key={designation} value={designation}>
                          {designation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  associate.designation
                )}
              </TableCell>
              <TableCell>
                {editingAssociate === associate.id ? (
                  <Select
                    value={editLocation}
                    onValueChange={(value) => setEditLocation(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  associate.location?.name
                )}
              </TableCell>
              <TableCell>
                {hasEditorRole && (
                  <Switch
                    checked={associate.isActive}
                    onCheckedChange={() => onToggleActive(associate.id, associate.isActive)}
                    aria-label="Toggle active status"
                  />
                )}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "tabular-nums font-medium",
                    associate.points !== undefined &&
                      associate.points < 0 &&
                      "text-destructive"
                  )}
                >
                  {associate.points !== undefined ? associate.points : "—"}
                </span>
                {hasEditorRole && onOpenPointsAdjustment && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-2 align-middle"
                    onClick={() => onOpenPointsAdjustment(associate)}
                    aria-label={`Adjust points for ${associate.name}`}
                    title="Adjust points"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
              <TableCell>
                {confirmingDelete === associate.id ? (
                  <div>
                    <span className="mr-2">Are you sure?</span>
                    <Button
                      onClick={() => handleConfirmDelete(associate.id)}
                      variant="destructive"
                      size="sm"
                      className="mr-2"
                    >
                      Yes
                    </Button>
                    <Button
                      onClick={() => setConfirmingDelete(null)}
                      variant="secondary"
                      size="sm"
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <>
                    {editingAssociate === associate.id ? (
                      <Button
                        onClick={() => handleSaveEdit(associate.id)}
                        variant="default"
                        size="sm"
                        className="mr-2"
                      >
                        Save
                      </Button>
                    ) : (
                      hasEditorRole && (
                        <Button
                          onClick={() => handleEditClick(associate)}
                          variant="outline"
                          size="sm"
                          className="mr-2"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )
                    )}
                    {hasEditorRole && (
                      <Button
                        onClick={() => handleDeleteClick(associate.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filteredAndSortedAssociates.length === 0 && (
        <p
          className="mt-4 rounded-md border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground"
          role="status"
        >
          No associates match your search or filters.
        </p>
      )}

      <Dialog open={!!errorMessage} onOpenChange={() => setErrorMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <p>{errorMessage}</p>
          <DialogFooter>
            <Button onClick={() => setErrorMessage(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssociatesTable;
