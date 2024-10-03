import React, { useState, useEffect } from 'react';
import { Notification, NotificationType, createNotification, getNotifications } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface NotificationTrackerProps {
  associateId: string;
  associateName: string;
  notificationType: NotificationType;
}

const notificationLevels = {
  [NotificationType.OCCURRENCE]: [
    { value: "Verbal Disciplinary Notice", label: "Verbal Disciplinary Notice" },
    { value: "First Written Notice", label: "First Written Notice" },
    { value: "Second Written Notice", label: "Second Written Notice" },
  ],
  [NotificationType.CORRECTIVE_ACTION]: [
    { value: "Coaching", label: "Coaching" },
    { value: "Verbal Warning", label: "Verbal Warning" },
    { value: "Written Warning", label: "Written Warning" },
    { value: "Final Written Warning", label: "Final Written Warning" },
  ],
};

export const NotificationTracker: React.FC<NotificationTrackerProps> = ({ 
  associateId, 
  associateName, 
  notificationType 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newNotification, setNewNotification] = useState({
    level: '',
    date: new Date().toISOString().split('T')[0],
    totalPoints: notificationType === NotificationType.OCCURRENCE ? '0' : '',
    description: '',
  });

  useEffect(() => {
    fetchNotifications();
  }, [associateId, notificationType]);

  const nTypeAsString = async (nType: NotificationType) => {
    return NotificationType[nType].toUpperCase();
  }

  const fetchNotifications = async () => {
    const fetchedNotifications = await getNotifications(associateId, await nTypeAsString(notificationType));
    setNotifications(fetchedNotifications);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'totalPoints') {
      // Allow only numbers and a single decimal point
      const regex = /^\d*\.?\d*$/;
      if (regex.test(value) || value === '') {
        setNewNotification(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setNewNotification(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewNotification(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createNotification({
      associateId,
      ...newNotification,
      type: notificationType,
      date: new Date(newNotification.date),
      totalPoints: newNotification.totalPoints ? parseFloat(newNotification.totalPoints) : undefined,
    });
    fetchNotifications();
    // Reset form
    setNewNotification({
      level: '',
      date: new Date().toISOString().split('T')[0],
      totalPoints: notificationType === NotificationType.OCCURRENCE ? '0' : '',
      description: '',
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">
        {notificationType === NotificationType.OCCURRENCE ? "Occurrence" : "Corrective Action"}
        {" "}Notifications for {associateName}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          value={newNotification.level}
          onValueChange={(value) => handleSelectChange('level', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select notification level" />
          </SelectTrigger>
          <SelectContent>
            {notificationLevels[notificationType].map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Level</TableHead>
            {notificationType === NotificationType.OCCURRENCE && <TableHead>Total Points</TableHead>}
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.map((notification) => (
            <TableRow key={notification.id}>
              <TableCell>{new Date(notification.date).toLocaleDateString()}</TableCell>
              <TableCell>{notification.level}</TableCell>
              {notificationType === NotificationType.OCCURRENCE && 
                <TableCell>
                  {typeof notification.totalPoints === 'number'
                    ? notification.totalPoints.toFixed(1)
                    : 'N/A'}
                </TableCell>
              }
              <TableCell>{notification.description || 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};