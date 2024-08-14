import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAssociatePointsAndNotification } from "@/components/lib/api";
import { deleteOccurrence } from "@/components/lib/api";

interface OccurrenceType {
  id: string;
  code: string;
  description: string;
  points: number;
}

interface Occurrence {
  id: string;
  type: OccurrenceType;
  date: Date;
  pointsAtTime: number;
  notes: string;
}

interface OccurrenceListProps {
  occurrences: Occurrence[];
  associateId: string | null;
  onDelete: (occurrenceId: string) => void;
}

const OccurrenceList: React.FC<OccurrenceListProps> = ({
  occurrences,
  associateId,
  onDelete,
}) => {
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [notificationLevel, setNotificationLevel] = useState<string>("None");

  const handleDelete = async (occurrenceId: string) => {
    const isConfirmed = window.confirm("Are you sure you want to delete?");

    if (!isConfirmed) {
      return; // do nothing
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

  useEffect(() => {
    const fetchPointsAndNotification = async () => {
      if (associateId) {
        try {
          const { points, notificationLevel } =
            await getAssociatePointsAndNotification(associateId);
          setTotalPoints(points);
          setNotificationLevel(notificationLevel);
        } catch (e) {
          console.error("Error fetching associate points and notification:", e);
        }
      }
    };

    fetchPointsAndNotification();
  }, [associateId, occurrences]);

  const isOverOneYearOld = (date: Date) => {
    const occurenceDate = new Date(date);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return occurenceDate < oneYearAgo;
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-2">Occurrence List</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {occurrences.map((occurrence) => {
            const isOld = isOverOneYearOld(occurrence.date);
            const rowStyle = isOld
              ? { color: "gray", textDecoration: "line-through" }
              : {};

            return (
              <TableRow key={occurrence.id} style={rowStyle}>
                <TableCell>{occurrence.type.code}</TableCell>
                <TableCell>{occurrence.type.description}</TableCell>
                <TableCell>
                  {new Date(occurrence.date).toLocaleDateString()}
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
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(occurrence.id)}
                    aria-label="Delete occurrence"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {occurrences.length === 0 ? (
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
        </div>
      )}
    </div>
  );
};

export default OccurrenceList;
