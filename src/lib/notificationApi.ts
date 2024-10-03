import api from "./apiConfig";
import {
  CreateNotificationData,
  Notification,
  Designation,
  NotificationLevel,
  NotificationType,
} from "./api";

export const createNotification = async (
  data: CreateNotificationData
): Promise<Notification> => {
  // Convert the numeric enum to its string representation
  const dataWithStringType = {
    ...data,
    type: NotificationType[data.type],
  };
  const response = await api.post<Notification>(
    "/notifications",
    dataWithStringType
  );
  return response.data;
};

export const getNotifications = async (
  associateId: string,
  type: string
): Promise<Notification[]> => {
  const response = await api.get<Notification[]>(
    `/notifications/${associateId}?type=${type}`
  );
  return response.data;
};

export const updateNotification = async (
  notificationId: string,
  data: Partial<Notification>
): Promise<Notification> => {
  const dataWithStringType = {
    ...data,
    type:
      data.type !== undefined
        ? typeof data.type === "number"
          ? NotificationType[data.type]
          : data.type
        : undefined,
  };

  const response = await api.put(
    `/notifications/${notificationId}`,
    dataWithStringType
  );
  return response.data;
};

export const deleteNotification = async (
  notificationId: string
): Promise<void> => {
  await api.delete(`/notifications/${notificationId}`);
};

export const getNotificationLevels = async (
  designation?: Designation
): Promise<NotificationLevel[]> => {
  try {
    let url = "/notification-levels";
    if (designation) {
      url += `?designation=${designation}`;
    }
    const response = await api.get<NotificationLevel[]>(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching notification levels:", error);
    throw error;
  }
};
