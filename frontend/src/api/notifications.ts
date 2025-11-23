/**
 * Notifications API
 */
import { apiClient } from './client';

export interface Notification {
  notificationId: number;
  userId: number;
  eventId: number | null;
  title: string;
  message: string;
  sendAt: string;
}

export interface NotificationsResponse {
  sent_count: number;
  sent: Notification[];
}

export const notificationsApi = {
  /**
   * Get all due notifications for the current user
   */
  getDue: async (): Promise<Notification[]> => {
    const response = await apiClient.get<NotificationsResponse>('/notifications/due');
    return response.sent;
  },
};

