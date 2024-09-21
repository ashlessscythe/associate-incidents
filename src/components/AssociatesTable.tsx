import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react"; // Import the trashcan icon
import { Associate } from "@/lib/api";

interface AssociatesTableProps {
  associates: Associate[];
  onDelete: (id: string) => void; // Add delete handler
}

const AssociatesTable: React.FC<AssociatesTableProps> = ({ associates, onDelete }) => {
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null); // For confirmation state

  const handleDeleteClick = (id: string) => {
    if (confirmingDelete === id) {
      onDelete(id); // Call delete handler if confirmed
      setConfirmingDelete(null); // Reset confirmation state
    } else {
      setConfirmingDelete(id); // Set confirmation state for the selected associate
    }
  };

  return (
    <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <TableHeader>
        <TableRow className="bg-gray-50 dark:bg-gray-800">
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Name
          </TableHead>
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        {associates.map((associate) => (
          <TableRow
            key={associate.id}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
              {associate.name}
            </TableCell>
            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
              {confirmingDelete === associate.id ? (
                <div>
                  <span className="mr-2">Are you sure?</span>
                  <button
                    onClick={() => handleDeleteClick(associate.id)}
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
                <button
                  onClick={() => handleDeleteClick(associate.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5 inline" />
                </button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AssociatesTable;
