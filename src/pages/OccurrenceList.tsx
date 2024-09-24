import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer, Trash2, Pencil, EyeOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAssociatePointsAndNotification,
  deleteOccurrence,
  updateOccurrence,
  AssociateInfo,
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
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import { Occurrence } from "@/lib/api";
import { loadAndInspectPdf } from "@/components/PDFOccurrences";

interface OccurrenceType {
  id: string;
  code: string;
  description: string;
  points: number;
}

interface OccurrenceListProps {
  occurrences?: Occurrence[] | [];
  associateInfo: AssociateInfo;
  onDelete: (occurrenceId: string) => void;
  onUpdate: (occurenceId: string) => void;
  occurrenceTypes: OccurrenceType[];
}

const OccurrenceList: React.FC<OccurrenceListProps> = ({
  occurrences,
  associateInfo,
  onUpdate,
  onDelete,
  occurrenceTypes,
}) => {
  const { user } = useAuthorizer();
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [notificationLevel, setNotificationLevel] = useState<string>("None");
  const [designation, setDesignation] = useState<string>("");
  const [editingOccurrence, setEditingOccurrence] = useState<Occurrence | null>(
    null
  );
  const [hideZeroPoints, setHideZeroPoints] = useState<boolean>(false);
  const [hideOldOccurrences, setHideOldOccurrences] = useState<boolean>(false);

  const hasEditorRole =
    user && Array.isArray(user.roles) && user.roles.includes("att-edit");

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

  useEffect(() => {
    const fetchPointsAndNotification = async () => {
      if (associateInfo.id) {
        try {
          const { points, notificationLevel, designation } =
            await getAssociatePointsAndNotification(associateInfo.id);
          setTotalPoints(points);
          setNotificationLevel(notificationLevel);
          setDesignation(designation);
        } catch (e) {
          console.error("Error fetching associate points and notification:", e);
        }
      }
    };

    fetchPointsAndNotification();
  }, [associateInfo.id, occurrences]);

  const isOverOneYearOld = (date: Date) => {
    const occurenceDate = new Date(date);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return occurenceDate < oneYearAgo;
  };

  const toggleHideZeroPoints = () => {
    setHideZeroPoints(!hideZeroPoints);
  };

  const toggleHideOldOccurrences = () => {
    setHideOldOccurrences(!hideOldOccurrences);
  };

  const filteredOccurrences = occurrences?.filter((occurrence) => {
    if (hideZeroPoints && occurrence.type.points === 0) {
      return false;
    }
    if (hideOldOccurrences && isOverOneYearOld(occurrence.date)) {
      return false;
    }
    return true;
  });

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-2">Occurrence List</h2>
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <Button
            onClick={toggleHideZeroPoints}
            variant={hideZeroPoints ? "destructive" : "outline"}
            className="flex items-center w-64 justify-center"
          >
            <EyeOff className="mr-2 h-4 w-4" />
            {hideZeroPoints ? "Show" : "Hide"} 0 Point Occurrences
          </Button>
          <Button
            onClick={toggleHideOldOccurrences}
            variant={hideOldOccurrences ? "destructive" : "outline"}
            className="flex items-center w-64 justify-center"
          >
            <Clock className="mr-2 h-4 w-4" />
            {hideOldOccurrences ? "Show" : "Hide"} Old Occurrences
          </Button>
        </div>
        {occurrences && (
          <Button
            onClick={() => loadAndInspectPdf()}
            className="text-gray-500 hover:text-gray-700"
            variant="ghost"
            size="icon"
            aria-label="Print corrective action"
          >
            <Printer size={20} />
          </Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOccurrences?.map((occurrence) => {
            const isOld = isOverOneYearOld(occurrence.date);
            const rowStyle = isOld
              ? { color: "gray", textDecoration: "line-through" }
              : {};

            return (
              <TableRow key={occurrence.id} style={rowStyle}>
                <TableCell>{occurrence.type.code}</TableCell>
                <TableCell>{occurrence.type.description}</TableCell>
                <TableCell>
                  {new Date(occurrence.date).toISOString().split("T")[0]}
                </TableCell>
                <TableCell>{occurrence.notes}</TableCell>
                <TableCell>
                  {occurrence.type.points}
                  {isOld && (
                    <span className="ml-2 text-sm text-gray-500">
                      (rolled out)
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {hasEditorRole ? (
                    <>
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
                    </>
                  ) : (
                    <span className="text-gray-400">No actions available</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {filteredOccurrences?.length === 0 ? (
        <p className="text-center text-gray-500 mt-4">
          No occurrences recorded
        </p>
      ) : (
        <div className="mt-4">
          <p className="font-semibold">
            Total Points (last 12 months): {totalPoints}
          </p>
          <p className="font-semibold">
            Current Notification Level: {notificationLevel}
          </p>
          <p className="font-semibold">Designation: {designation}</p>
        </div>
      )}

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
                  <Input
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
