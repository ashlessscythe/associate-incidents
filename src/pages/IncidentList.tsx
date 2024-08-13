import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface IncidentType {
  id: string;
  name: string;
  description: string;
  points: number;
}

interface IncidentType {
  id: string;
  name: string;
  description: string;
}

interface Incident {
  id: string;
  type: IncidentType; // Changed from typeId to type
  description: string;
  date: string;
  isVerbal: boolean;
}

interface IncidentListProps {
  incidents: Incident[];
  incidentTypes: IncidentType[];
}

const IncidentList: React.FC<IncidentListProps> = ({ incidents }) => {
  // calculate total points
  const totalPoints = incidents.reduce(
    (sum, incident) => sum + incident.type.points,
    0
  );

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-2">Incident List</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Verbal</TableHead>
            <TableHead>Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((incident) => (
            <TableRow key={incident.id}>
              <TableCell>{incident.type.name}</TableCell>
              <TableCell>{incident.type.description}</TableCell>
              <TableCell>{incident.description}</TableCell>
              <TableCell>
                {new Date(incident.date).toLocaleDateString()}
              </TableCell>
              <TableCell>{incident.isVerbal ? "Yes" : "No"}</TableCell>
              <TableCell>{incident.type.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {incidents.length === 0 ? (
        <p className="text-center text-gray-500 mt-4">No incidents recorded</p>
      ) : (
        <p className="text-right font-semibold mt-2">
          Total Points: {totalPoints}
        </p>
      )}
    </div>
  );
};

export default IncidentList;
