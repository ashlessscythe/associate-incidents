import React, { useState, useEffect } from "react";
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
}

interface Incident {
  id: string;
  typeId: string; // Changed from type to typeId
  description: string;
  date: string;
  isVerbal: boolean;
}

interface IncidentListProps {
  incidents: Incident[];
  incidentTypes: IncidentType[];
}

const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  incidentTypes,
}) => {
  // function to get type name from typeId
  const getTypeName = (typeId: string) => {
    const type = incidentTypes.find((t) => t.id === typeId);
    return type?.name || "Unknown";
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-2">Incident List</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Verbal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((incident) => (
            <TableRow key={incident.id}>
              <TableCell>{getTypeName(incident.typeId)}</TableCell>
              <TableCell>{incident.description}</TableCell>
              <TableCell>
                {new Date(incident.date).toLocaleDateString()}
              </TableCell>
              <TableCell>{incident.isVerbal ? "Yes" : "No"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {incidents.length === 0 && (
        <p className="text-center text-gray-500 mt-4">No incidents recorded.</p>
      )}
    </div>
  );
};

export default IncidentList;
