import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Associate } from "@/lib/api";

interface AssociatesTableProps {
  associates: Associate[];
}

const AssociatesTable: React.FC<AssociatesTableProps> = ({ associates }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {associates.map((associate) => (
          <TableRow key={associate.id}>
            <TableCell>{associate.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AssociatesTable;
