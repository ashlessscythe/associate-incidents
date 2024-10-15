import React from "react";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { UploadedFile } from "@/lib/types";
import { Trash2 } from "lucide-react";

interface UploadedFilesProps {
  files: UploadedFile[];
  onDownload: (fileId: string) => void;
  onDelete: (fileId: string) => void;
  hasEditorRole: boolean | null;
}

const UploadedFiles: React.FC<UploadedFilesProps> = ({
  files,
  onDownload,
  onDelete,
  hasEditorRole,
}) => {
  return (
    <div className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell>{file.filename}</TableCell>
              <TableCell>
                {file.size
                  ? file.size < 1024 * 1024
                    ? `${(file.size / 1024).toFixed(2)} KB`
                    : `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                  : "Unknown"}
              </TableCell>
              <TableCell>{file.uploadDate || "-"}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button onClick={() => onDownload(file.id)}>Download</Button>
                  {hasEditorRole && (
                    <Button
                      variant="destructive"
                      onClick={() => onDelete(file.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UploadedFiles;
