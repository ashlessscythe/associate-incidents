import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAssociatePointsAndNotification } from "@/components/lib/api";

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
}

interface OccurrenceListProps {
  occurrences: Occurrence[];
  associateId: string | null;
}

const OccurrenceList: React.FC<OccurrenceListProps> = ({
  occurrences,
  associateId,
}) => {
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [notificationLevel, setNotificationLevel] = useState<string>("None");

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
                <TableCell>
                  {occurrence.type.points}
                  {isOld && (
                    <span className="ml-2 text-sm text-gray-500">
                      (rolled out)
                    </span>
                  )}
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
