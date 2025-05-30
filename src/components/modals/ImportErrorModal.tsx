import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ImportError {
  row: number;
  message: string;
  data: Record<string, string>;
}

interface ImportErrorModalProps {
  open: boolean;
  onClose: () => void;
  errors: ImportError[];
  summary: {
    success: number;
    skipped: number;
  };
}

const ImportErrorModal: React.FC<ImportErrorModalProps> = ({
  open,
  onClose,
  errors,
  summary,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-500">
            Import Completed with Errors
          </DialogTitle>
          <DialogDescription>
            Successfully processed {summary.success} records, but encountered{" "}
            {errors.length} errors.
            {summary.skipped > 0 && ` ${summary.skipped} records were skipped.`}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-auto rounded-md border p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Row</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.map((error, index) => (
                <TableRow key={index}>
                  <TableCell>{error.row}</TableCell>
                  <TableCell className="text-red-500">
                    {error.message}
                  </TableCell>
                  <TableCell>
                    <pre className="text-xs whitespace-pre-wrap">
                      {Object.entries(error.data)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join("\n")}
                    </pre>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportErrorModal;
