import React, { useState } from "react";
import { useUploadOccurrenceFile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

interface OccurrenceUploadButtonProps {
  onUploadComplete: (url: string) => void;
  onUploadError: (error: Error) => void;
}

const OccurrenceUploadButton: React.FC<OccurrenceUploadButtonProps> = ({
  onUploadComplete,
  onUploadError,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const uploadFile = useUploadOccurrenceFile();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onUploadComplete(url);
    } catch (error) {
      console.error("Upload failed", error);
      onUploadError(
        error instanceof Error ? error : new Error("Upload failed")
      );
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="file"
        onChange={handleFileChange}
        className="hidden"
        id="occurrence-file-upload"
        accept=".xlsx,.xls,.pdf"
      />
      <label
        htmlFor="occurrence-file-upload"
        className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <UploadCloud className="mr-2 h-5 w-5" />
        Select File
      </label>
      <span className="text-sm text-gray-500">
        {file ? file.name : "No file selected"}
      </span>
      <Button
        onClick={handleUpload}
        disabled={uploading || !file}
        variant="outline"
      >
        {uploading ? "Uploading..." : "Upload Documentation"}
      </Button>
    </div>
  );
};

export default OccurrenceUploadButton;
