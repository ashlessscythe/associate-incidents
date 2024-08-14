import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
}

const OccurrenceList: React.FC<OccurrenceListProps> = ({ occurrences }) => {
  // calculate total points
  const totalPoints = occurrences.reduce(
    (sum, occurrence) => sum + occurrence.pointsAtTime,
    0
  );

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
          {occurrences.map((occurrence) => (
            <TableRow key={occurrence.id}>
              <TableCell>{occurrence.type.code}</TableCell>
              <TableCell>{occurrence.type.description}</TableCell>
              <TableCell>
                {new Date(occurrence.date).toLocaleDateString()}
              </TableCell>
              <TableCell>{occurrence.pointsAtTime}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {occurrences.length === 0 ? (
        <p className="text-center text-gray-500 mt-4">
          No occurrences recorded
        </p>
      ) : (
        <p className="text-right font-semibold mt-2">
          Total Points: {totalPoints}
        </p>
      )}
    </div>
  );
};

export default OccurrenceList;
