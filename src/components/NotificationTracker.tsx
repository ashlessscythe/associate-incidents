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

      <div className="flex items-center space-x-2">
        <Switch
          id="show-input-fields"
          checked={showInputFields}
          onCheckedChange={setShowInputFields}
        />
        <Label htmlFor="show-input-fields">Add New</Label>
      </div>

      {showInputFields && (
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.map((notification) => (
            <TableRow
              key={notification.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <TableCell>
                {new Date(notification.date).toLocaleDateString()}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
