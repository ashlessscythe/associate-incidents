import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Pencil, ChevronUp, ChevronDown } from "lucide-react";
import {
  AssociateAndDesignation,
  Department,
  getDepartments,
  Location,
  getLocations,
} from "@/lib/api";
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
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import { Link } from "react-router-dom";

interface AssociatesTableProps {
  associates: AssociateAndDesignation[];
  onDelete: (id: string) => void;
  onEdit: (
    id: string,
    name: string,
    departmentId: string,
    designation: string,
    location: string
  ) => void;
}

type SortKey = "name" | "department" | "designation" | "location";
type SortOrder = "asc" | "desc";

const EDITOR_ROLES = ["att-edit", "user-edit"];

const AssociatesTable: React.FC<AssociatesTableProps> = ({
  associates,
  onDelete,
  onEdit,
}) => {
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingAssociate, setEditingAssociate] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuthorizer();

  const hasEditorRole =
    user &&
    Array.isArray(user.roles) &&
    user.roles.some((role) => EDITOR_ROLES.includes(role));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedDepartments, fetchedLocations] = await Promise.all([
          getDepartments(),
          getLocations(),
        ]);
        setDepartments(fetchedDepartments);
        setLocations(fetchedLocations);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

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

  const handleSaveEdit = (id: string) => {
    if (!hasEditorRole) return;
    onEdit(id, editName, editDepartmentId, editDesignation, editLocation);
    setEditingAssociate(null);
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
    return associates
      .filter(
        (associate) =>
          associate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          associate.department?.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          associate.designation
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (associate.location?.name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortKey === "name") {
          return sortOrder === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else if (sortKey === "department") {
          return sortOrder === "asc"
            ? (a.department?.name || "").localeCompare(b.department?.name || "")
            : (b.department?.name || "").localeCompare(
                a.department?.name || ""
              );
        } else if (sortKey === "designation") {
          return sortOrder === "asc"
            ? a.designation.localeCompare(b.designation)
            : b.designation.localeCompare(a.designation);
        } else {
          return sortOrder === "asc"
            ? (a.location?.name || "").localeCompare(b.location?.name || "")
            : (b.location?.name || "").localeCompare(a.location?.name || "");
        }
      });
  }, [associates, searchTerm, sortKey, sortOrder]);

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
      <Input
        type="text"
        placeholder="Search associates..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-800">
            <TableHead
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort("name")}
            >
              Name <SortIcon columnKey="name" />
            </TableHead>
            <TableHead
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort("department")}
            >
              Department <SortIcon columnKey="department" />
            </TableHead>
            <TableHead
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort("designation")}
            >
              Designation <SortIcon columnKey="designation" />
            </TableHead>
            <TableHead
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort("location")}
            >
              Location <SortIcon columnKey="location" />
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {filteredAndSortedAssociates.map((associate) => (
            <TableRow
              key={associate.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                {editingAssociate === associate.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200"
                  />
                ) : (
                  <>
                    <Link
                      to={`/attendance?associateId=${associate.id}`}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 mr-2"
                    >
                      {associate.name}
                    </Link>
                    <Link
                      to={`/ca?associateId=${associate.id}`}
                      className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                    >
                      (CA)
                    </Link>
                  </>
                )}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
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
                  associate.department?.name
                )}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                {editingAssociate === associate.id ? (
                  <input
                    type="text"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="border rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200"
                  />
                ) : (
                  associate.designation
                )}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
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
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                {confirmingDelete === associate.id ? (
                  <div>
                    <span className="mr-2">Are you sure?</span>
                    <button
                      onClick={() => handleConfirmDelete(associate.id)}
                      className="text-red-500 hover:text-red-700 mr-2"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <>
                    {editingAssociate === associate.id ? (
                      <button
                        onClick={() => handleSaveEdit(associate.id)}
                        className="text-green-500 hover:text-green-700 mr-2"
                      >
                        Save
                      </button>
                    ) : (
                      hasEditorRole && (
                        <button
                          onClick={() => handleEditClick(associate)}
                          className="text-blue-500 hover:text-blue-700 mr-2"
                        >
                          <Pencil className="h-5 w-5 inline" />
                        </button>
                      )
                    )}
                    {hasEditorRole && (
                      <button
                        onClick={() => handleDeleteClick(associate.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5 inline" />
                      </button>
                    )}
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialog */}
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
