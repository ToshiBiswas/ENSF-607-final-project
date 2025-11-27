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

  /**
   * Delete/mark as read a notification
   */
  delete: async (notificationId: number): Promise<void> => {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  /**
   * Create a reminder notification for an event
   */
  create: async (data: {
    event_id: number;
    send_at?: string;
    reminder_type?: string;
    message?: string;
  }): Promise<Notification> => {
    const response = await apiClient.post<{ notification: Notification }>('/notifications', data);
    return response.notification;
  },
};

