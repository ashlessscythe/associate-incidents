import api from './apiConfig';

export enum NotificationType {
    OCCURRENCE,
    CORRECTIVE_ACTION,
}

export interface Notification {
    id: string;
    associateId: string;
    date: Date;
    type: NotificationType;
    level: string;
    totalPoints?: number;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateNotificationData {
  associateId: string;
  date: Date;
  type: NotificationType;
  level: string;
  totalPoints?: number;
  description?: string;
}

export const createNotification = async (data: CreateNotificationData): Promise<Notification> => {
  // Convert the numeric enum to its string representation
  const dataWithStringType = {
    ...data,
    type: NotificationType[data.type]
  };
  const response = await api.post<Notification>('/notifications', dataWithStringType);
  return response.data;
};

export const getNotifications = async (associateId: string, type: string): Promise<Notification[]> => {
  const response = await api.get<Notification[]>(`/notifications/${associateId}?type=${type}`);
  return response.data;
};

export const updateNotification = async (notificationId: string, data: Partial<Notification>): Promise<Notification> => {
  // Convert the numeric enum to its string representation if type is being updated
  const dataWithStringType = data.type !== undefined
    ? { ...data, type: NotificationType[data.type] }
    : data;
  const response = await api.put(`/notifications/${notificationId}`, dataWithStringType);
  return response.data;
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  await api.delete(`/notifications/${notificationId}`);
};
