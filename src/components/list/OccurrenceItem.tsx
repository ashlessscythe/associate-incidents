import React, { useState } from "react";
import { Occurrence, OccurrenceType, AssociateInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Upload } from "lucide-react";
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import { toast } from "react-hot-toast";
import UploadedFiles from "@/components/UploadedFiles";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface OccurrenceItemProps {
  occurrence: Occurrence;
  occurrenceTypes: OccurrenceType[];
  associateInfo: AssociateInfo;
  onEdit?: (occurrence: Occurrence) => void;
  onDelete?: (id: string) => Promise<void>;
  onUploadFile?: (occurrenceId: string, file: File) => Promise<void>;
  onDownloadFile?: (fileId: string, filename: string) => Promise<void>;
  onDeleteFile?: (fileId: string) => Promise<void>;
}

const OccurrenceItem: React.FC<OccurrenceItemProps> = ({
  occurrence,
  onEdit,
  onDelete,
  onUploadFile,
  onDownloadFile,
  onDeleteFile,
}) => {
  const { user } = useAuthorizer();
  const hasEditorRole =
    user && Array.isArray(user.roles) && user.roles.includes("att-edit");
  const [viewFiles, setViewFiles] = useState(false);

  const isOverOneYearOld = (date: Date) => {
    const occurrenceDate = new Date(date);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return occurrenceDate < oneYearAgo;
  };

  const handleUpload = async () => {
    if (!onUploadFile) {
      console.error("Upload function is not available");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.txt";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 1024 * 1024) {
          toast.error(
            "File size exceeds 1MB limit. Please choose a smaller file."
          );
          return;
        }
        try {
          await onUploadFile(occurrence.id, file);
          toast.success("File uploaded successfully");
        } catch (error) {
          console.error("Error uploading file:", error);
          toast.error("Failed to upload file. Please try again.");
        }
      }
    };
    input.click();
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(occurrence);
    } else {
      console.error("Edit function is not available");
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      try {
        await onDelete(occurrence.id);
      } catch (error) {
        console.error("Error deleting occurrence:", error);
        toast.error("Failed to delete occurrence. Please try again.");
      }
    } else {
      console.error("Delete function is not available");
    }
  };

  const handleDownload = (fileId: string, filename: string) => {
    if (onDownloadFile) {
      onDownloadFile(fileId, filename);
    } else {
      console.error("Download function is not available");
    }
  };

  const isOld = isOverOneYearOld(occurrence.date);
  const rowStyle = isOld
    ? { color: "gray", textDecoration: "line-through" }
    : {};

  return (
    <li
      className="bg-card text-card-foreground p-4 rounded-lg shadow mb-4"
      style={rowStyle}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold">
            {occurrence.type.code}: {occurrence.type.description}
          </p>
          <p>Date: {new Date(occurrence.date).toISOString().split("T")[0]}</p>
          <p>Points: {occurrence.type.points}</p>
          <p>Notes: {occurrence.notes}</p>
        </div>
        <div className="flex space-x-2">
          {hasEditorRole && (
            <>
              <Button
                onClick={handleEdit}
                variant="ghost"
                size="icon"
                aria-label="Edit occurrence"
              >
                <Pencil size={20} />
              </Button>
              <Button
                onClick={handleDelete}
                variant="ghost"
                size="icon"
                aria-label="Delete occurrence"
              >
                <Trash2 size={20} />
              </Button>
              <Button
                onClick={handleUpload}
                variant="ghost"
                size="icon"
                aria-label="Upload file"
              >
                <Upload size={20} />
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="mt-4">
        {occurrence.files && occurrence.files.length > 0 ? (
          <div className="flex items-center space-x-2">
            <span>{occurrence.files.length} file(s)</span>
            <Switch
              id={`view-files-${occurrence.id}`}
              checked={viewFiles}
              onCheckedChange={setViewFiles}
            />
            <Label htmlFor={`view-files-${occurrence.id}`}>View Files</Label>
          </div>
        ) : (
          <span className="text-muted-foreground">No files</span>
        )}
      </div>
      {viewFiles && occurrence.files && occurrence.files.length > 0 && (
        <UploadedFiles
          files={occurrence.files}
          onDownload={(fileId) => {
            const file = occurrence.files?.find((f) => f.id === fileId);
            if (file) {
              handleDownload(fileId, file.filename);
            }
          }}
          onDelete={
            onDeleteFile ||
            (() => console.error("Delete function is not available"))
          }
          hasEditorRole={hasEditorRole}
        />
      )}
    </li>
  );
};

export default OccurrenceItem;
