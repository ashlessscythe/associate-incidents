import React, { useState, useEffect } from "react";
import {
  Designation,
  Notification,
  NotificationType,
  NotificationLevel,
  createNotification,
  getNotificationLevels,
  getNotifications,
} from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateNotification, deleteNotification } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuthorizer } from "@authorizerdev/authorizer-react";

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
  };

  const fetchNotificationLevels = async () => {
    const levels = await getNotificationLevels(associateDesignation);
    setNotificationLevels(levels);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "totalPoints") {
      // Allow only numbers and a single decimal point
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
    // Reset form
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
  };

  return (
    <div className="space-y-4">
      {/* Separator */}
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
          >
            <SelectTrigger>
              <SelectValue placeholder="Select notification level" />
            </SelectTrigger>
            <SelectContent>
              {notificationLevels.map((level) => (
                <SelectItem key={level.levelNumber} value={level.levelText}>
                  {`${level.levelNumber} - ${level.levelText}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            name="date"
            value={newNotification.date}
            onChange={handleInputChange}
          />

          {notificationType === NotificationType.OCCURRENCE && (
            <Input
              type="text"
              name="totalPoints"
              value={newNotification.totalPoints}
              onChange={handleInputChange}
              placeholder="Total Points"
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
            {hasEditorRole && (
              <TableHead className="font-semibold text-lg">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.map((notification) => (
            <TableRow
              key={notification.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800"
            >
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
                    <SelectItem key={level.levelNumber} value={level.levelText}>
                      {`${level.levelNumber} - ${level.levelText}`}
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
