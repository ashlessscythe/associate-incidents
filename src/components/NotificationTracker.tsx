import React, { useState, useEffect } from "react";
import {
  Designation,
  Notification,
  NotificationType,
  NotificationLevel,
  createNotification,
  getNotificationLevels,
  getNotifications,
  updateNotification,
  deleteNotification,
  uploadFile,
  downloadFile,
  deleteFile,
} from "../lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Pencil, Trash2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import { toast } from "react-hot-toast";
import UploadedFiles from "./UploadedFiles";

interface NotificationTrackerProps {
  associateId: string;
  associateDesignation: Designation;
  associateName: string;
  notificationType: NotificationType;
}

export const NotificationTracker: React.FC<NotificationTrackerProps> = ({
  associateId,
  associateDesignation,
  associateName,
  notificationType,
}) => {
  const { user } = useAuthorizer();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationLevels, setNotificationLevels] = useState<
    NotificationLevel[]
  >([]);
  const [newNotification, setNewNotification] = useState({
    level: "",
    date: new Date().toISOString().split("T")[0],
    totalPoints: notificationType === NotificationType.OCCURRENCE ? "0" : "",
    description: "",
  });
  const [showInputFields, setShowInputFields] = useState(false);
  const [editingNotification, setEditingNotification] =
    useState<Notification | null>(null);
  const [deletingNotificationId, setDeletingNotificationId] = useState<
    string | null
  >(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [viewFiles, setViewFiles] = useState<{ [key: string]: boolean }>({});

  const hasEditorRole =
    user &&
    Array.isArray(user.roles) &&
    ((notificationType === NotificationType.OCCURRENCE &&
      user.roles.includes("att-edit")) ||
      (notificationType === NotificationType.CORRECTIVE_ACTION &&
        user.roles.includes("ca-edit")));

  useEffect(() => {
    fetchNotifications();
    fetchNotificationLevels();
  }, [associateId, notificationType, associateDesignation]);

  const nTypeAsString = (nType: NotificationType) => {
    return NotificationType[nType].toUpperCase();
  };

  const fetchNotifications = async () => {
    const fetchedNotifications = await getNotifications(
      associateId,
      nTypeAsString(notificationType)
    );
    setNotifications(fetchedNotifications);
    const initialViewFiles = fetchedNotifications.reduce(
      (acc, notification) => {
        acc[notification.id] = false;
        return acc;
      },
      {} as { [key: string]: boolean }
    );
    setViewFiles(initialViewFiles);
  };

  const fetchNotificationLevels = async () => {
    const levels = await getNotificationLevels(associateDesignation);
    // Sort levels by level number
    const sortedLevels = [...levels].sort((a, b) => a.level - b.level);
    setNotificationLevels(sortedLevels);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "totalPoints") {
      const regex = /^\d*\.?\d*$/;
      if (regex.test(value) || value === "") {
        setNewNotification((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setNewNotification((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewNotification((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasEditorRole) return;
    if (!newNotification.level) {
      alert("Please select a notification level.");
      return;
    }
    await createNotification({
      associateId,
      ...newNotification,
      type: notificationType,
      date: new Date(newNotification.date),
      totalPoints: newNotification.totalPoints
        ? parseFloat(newNotification.totalPoints)
        : undefined,
    });
    fetchNotifications();
    setNewNotification({
      level: "",
      date: new Date().toISOString().split("T")[0],
      totalPoints: notificationType === NotificationType.OCCURRENCE ? "0" : "",
      description: "",
    });
  };

  const handleEdit = (notification: Notification) => {
    if (!hasEditorRole) return;
    setEditingNotification(notification);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasEditorRole || !editingNotification) return;
    await updateNotification(editingNotification.id, editingNotification);
    setEditingNotification(null);
    fetchNotifications();
  };

  const handleDelete = async (id: string) => {
    if (!hasEditorRole) return;
    setDeletingNotificationId(id);
  };

  const confirmDelete = async () => {
    if (!hasEditorRole || !deletingNotificationId) return;
    await deleteNotification(deletingNotificationId);
    setDeletingNotificationId(null);
    fetchNotifications();
  };

  const handleCancel = () => {
    setEditingNotification(null);
    setDeletingNotificationId(null);
    setDeletingFileId(null);
  };

  const handleUpload = async (notificationId: string, associateId: string) => {
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
          const formData = new FormData();
          formData.append("file", file);
          formData.append("associateId", associateId);
          formData.append("notificationId", notificationId);

          const result = await uploadFile(formData);
          console.log("File uploaded successfully:", result);
          toast.success(result.message);
          fetchNotifications();
        } catch (error) {
          console.error("Error uploading file:", error);
          toast.error("Failed to upload file. Please try again.");
        }
      }
    };
    input.click();
  };

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      const file = await downloadFile(fileId);
      const url = window.URL.createObjectURL(file);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file. Please try again.");
    }
  };

  const handleDeleteFile = (fileId: string) => {
    if (!hasEditorRole) return;
    setDeletingFileId(fileId);
  };

  const confirmDeleteFile = async () => {
    if (!hasEditorRole || !deletingFileId) return;
    try {
      await deleteFile(deletingFileId);
      toast.success("File deleted successfully");
      setDeletingFileId(null);
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file. Please try again.");
    }
  };

  const toggleViewFiles = (notificationId: string) => {
    setViewFiles((prev) => ({
      ...prev,
      [notificationId]: !prev[notificationId],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
      <h2 className="text-2xl font-bold">
        {notificationType === NotificationType.OCCURRENCE
          ? "Occurrence"
          : "Corrective Action"}{" "}
        Notices for {associateName}
      </h2>

      {hasEditorRole && (
        <div className="flex items-center space-x-2">
          <Switch
            id="show-input-fields"
            checked={showInputFields}
            onCheckedChange={setShowInputFields}
          />
          <Label htmlFor="show-input-fields">Add New</Label>
        </div>
      )}

      {showInputFields && hasEditorRole && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-4 border rounded-md"
        >
          <h3 className="text-lg font-semibold">Enter new notice record:</h3>
          <Select
            value={newNotification.level}
            onValueChange={(value) => handleSelectChange("level", value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select notification level" />
            </SelectTrigger>
            <SelectContent>
              {notificationLevels.map((level) => (
                <SelectItem key={level.level} value={level.name}>
                  {`${level.level} - ${level.name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            name="date"
            value={newNotification.date}
            onChange={handleInputChange}
            required
          />

          {notificationType === NotificationType.OCCURRENCE && (
            <Input
              type="text"
              name="totalPoints"
              onChange={handleInputChange}
              placeholder="Total Points"
              required
            />
          )}

          <Input
            type="text"
            name="description"
            value={newNotification.description}
            onChange={handleInputChange}
            placeholder="Description"
          />

          <Button type="submit">Add Notification</Button>
        </form>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold text-lg">Date</TableHead>
            <TableHead className="font-semibold text-lg">Level</TableHead>
            {notificationType === NotificationType.OCCURRENCE && (
              <TableHead className="font-semibold text-lg">
                Total Points
              </TableHead>
            )}
            <TableHead className="font-semibold text-lg">Description</TableHead>
            <TableHead className="font-semibold text-lg">Files</TableHead>
            {hasEditorRole && (
              <TableHead className="font-semibold text-lg">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.map((notification) => (
            <React.Fragment key={notification.id}>
              <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <TableCell>
                  {new Date(notification.date).toISOString().split("T")[0]}
                </TableCell>
                <TableCell>{notification.level}</TableCell>
                {notificationType === NotificationType.OCCURRENCE && (
                  <TableCell>
                    {typeof notification.totalPoints === "number"
                      ? notification.totalPoints.toFixed(1)
                      : "N/A"}
                  </TableCell>
                )}
                <TableCell>{notification.description || "N/A"}</TableCell>
                <TableCell>
                  {notification.files && notification.files.length > 0 ? (
                    <div className="flex items-center space-x-2">
                      <span>{notification.files.length} file(s)</span>
                      <Switch
                        id={`view-files-${notification.id}`}
                        checked={viewFiles[notification.id]}
                        onCheckedChange={() => toggleViewFiles(notification.id)}
                      />
                      <Label htmlFor={`view-files-${notification.id}`}>
                        View Files
                      </Label>
                    </div>
                  ) : (
                    <span className="text-gray-500 mr-2">No files</span>
                  )}
                  {hasEditorRole && (
                    <Button
                      onClick={() => handleUpload(notification.id, associateId)}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      <Upload size={16} className="mr-2" />
                      Upload
                    </Button>
                  )}
                </TableCell>
                {hasEditorRole && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(notification)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
              {viewFiles[notification.id] &&
                notification.files &&
                notification.files.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <UploadedFiles
                        files={notification.files}
                        onDownload={(fileId) => {
                          const file = notification.files?.find(
                            (f) => f.id === fileId
                          );
                          if (file) {
                            handleDownload(fileId, file.filename);
                          }
                        }}
                        onDelete={handleDeleteFile}
                        hasEditorRole={hasEditorRole}
                      />
                    </TableCell>
                  </TableRow>
                )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>

      {editingNotification && hasEditorRole && (
        <Dialog
          open={!!editingNotification}
          onOpenChange={() => setEditingNotification(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Notification</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <Select
                value={editingNotification.level}
                onValueChange={(value) =>
                  setEditingNotification({
                    ...editingNotification,
                    level: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select notification level" />
                </SelectTrigger>
                <SelectContent>
                  {notificationLevels.map((level) => (
                    <SelectItem key={level.level} value={level.name}>
                      {`${level.level} - ${level.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={
                  new Date(editingNotification.date).toISOString().split("T")[0]
                }
                onChange={(e) =>
                  setEditingNotification({
                    ...editingNotification,
                    date: new Date(e.target.value),
                  })
                }
              />
              {notificationType === NotificationType.OCCURRENCE && (
                <Input
                  type="number"
                  value={editingNotification.totalPoints || ""}
                  onChange={(e) =>
                    setEditingNotification({
                      ...editingNotification,
                      totalPoints: parseFloat(e.target.value),
                    })
                  }
                  placeholder="Total Points"
                />
              )}
              <Input
                type="text"
                value={editingNotification.description || ""}
                onChange={(e) =>
                  setEditingNotification({
                    ...editingNotification,
                    description: e.target.value,
                  })
                }
                placeholder="Description"
              />
              <DialogFooter>
                <Button type="submit">Save changes</Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {deletingNotificationId && hasEditorRole && (
        <Dialog
          open={!!deletingNotificationId}
          onOpenChange={() => setDeletingNotificationId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this notification?</p>
            <DialogFooter>
              <Button onClick={confirmDelete}>Yes, delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {deletingFileId && hasEditorRole && (
        <Dialog
          open={!!deletingFileId}
          onOpenChange={() => setDeletingFileId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm File Deletion</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this file?</p>
            <DialogFooter>
              <Button onClick={confirmDeleteFile}>Yes, delete</Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
