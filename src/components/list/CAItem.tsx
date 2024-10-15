import React, { useState } from "react";
import {
  CorrectiveAction,
  Rule,
  exportExcelCA,
  Associate,
  AssociateInfo,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Edit2, Trash2, Upload } from "lucide-react";
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import ExportCADetailsModal from "../modals/ExportCADetailsModal";
import { toast } from "react-hot-toast";
import UploadedFiles from "../UploadedFiles";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CAItemProps {
  ca: CorrectiveAction;
  rules: Rule[];
  onEditCA?: (ca: CorrectiveAction) => void;
  onDeleteCA?: (id: string) => Promise<void>;
  level: number;
  associate: Associate;
  associateInfo: AssociateInfo;
  associateLocation?: string;
  associateDepartment?: string;
  onUploadFile?: (caId: string, file: File) => Promise<void>;
  onDownloadFile?: (fileId: string, filename: string) => Promise<void>;
  onDeleteFile?: (fileId: string) => Promise<void>;
}

const CAItem: React.FC<CAItemProps> = ({
  ca,
  rules,
  onEditCA,
  onDeleteCA,
  onUploadFile,
  onDownloadFile,
  onDeleteFile,
  associate,
  level,
  associateLocation,
  associateDepartment,
}) => {
  const { user } = useAuthorizer();
  const hasEditorRole =
    user && Array.isArray(user.roles) && user.roles.includes("ca-edit");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [viewFiles, setViewFiles] = useState(false);

  const getRuleDescription = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    return rule
      ? `${rule.type} - ${rule.code}: ${rule.description}`
      : "Unknown Rule";
  };

  const getLevelDescription = (level: number) => {
    switch (level) {
      case 0:
        return "0 - Coaching";
      case 1:
        return "1 - Documented Verbal Warning";
      case 2:
        return "2 - Written Warning";
      case 3:
        return "3 - Final Written Warning";
      case 4:
        return "4 - Termination";
      default:
        return `${level} - Unknown Level`;
    }
  };

  const handleExport = async (
    selectedLocation: string,
    selectedDepartment: string
  ) => {
    const location = associateLocation || selectedLocation;
    const department = associateDepartment || selectedDepartment;
    try {
      const blob = await exportExcelCA(
        associate.name,
        location,
        department,
        new Date().toISOString().split("T")[0], // current date
        ca, // single CA
        getLevelDescription(level) // notification level
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${associate.name}_corrective_action.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error(
        "An error occurred while exporting to Excel. Please try again."
      );
    }
  };

  const handleExportClick = () => {
    if (associateLocation && associateDepartment) {
      handleExport(associateLocation, associateDepartment);
    } else {
      setIsExportModalOpen(true);
    }
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
          await onUploadFile(ca.id, file);
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
    if (onEditCA) {
      onEditCA(ca);
    } else {
      console.error("Edit function is not available");
    }
  };

  const handleDelete = async () => {
    if (onDeleteCA) {
      try {
        await onDeleteCA(ca.id);
      } catch (error) {
        console.error("Error deleting CA:", error);
        toast.error("Failed to delete corrective action. Please try again.");
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

  return (
    <li className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold">{getRuleDescription(ca.ruleId)}</p>
          <p>{getLevelDescription(level)}</p>
          <p>Date: {new Date(ca.date).toISOString().split("T")[0]}</p>
          <p>Description: {ca.description}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleExportClick}
            className="text-green-500 hover:text-green-700"
            variant="ghost"
            size="icon"
            aria-label="Export corrective action"
          >
            <FileSpreadsheet size={20} />
          </Button>
          {hasEditorRole && (
            <>
              <Button
                onClick={handleEdit}
                className="text-blue-500 hover:text-blue-700"
                variant="ghost"
                size="icon"
              >
                <Edit2 size={20} />
              </Button>
              <Button
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700"
                variant="ghost"
                size="icon"
                aria-label="Delete corrective action"
              >
                <Trash2 size={20} />
              </Button>
              <Button
                onClick={handleUpload}
                className="text-purple-500 hover:text-purple-700"
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
        {ca.files && ca.files.length > 0 ? (
          <div className="flex items-center space-x-2">
            <span>{ca.files.length} file(s)</span>
            <Switch
              id={`view-files-${ca.id}`}
              checked={viewFiles}
              onCheckedChange={setViewFiles}
            />
            <Label htmlFor={`view-files-${ca.id}`}>View Files</Label>
          </div>
        ) : (
          <span className="text-gray-500">No files</span>
        )}
      </div>
      {viewFiles && ca.files && ca.files.length > 0 && (
        <UploadedFiles
          files={ca.files}
          onDownload={(fileId) => {
            const file = ca.files?.find((f) => f.id === fileId);
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
      <ExportCADetailsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        initialDepartment={associateDepartment}
        initialLocation={associateLocation}
      />
    </li>
  );
};

export default CAItem;
