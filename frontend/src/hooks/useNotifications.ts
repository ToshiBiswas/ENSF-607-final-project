import { useState, useEffect } from 'react';
import { notificationsApi, Notification } from '../api/notifications';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook to manage notifications with auto-refresh
 */
export const useNotifications = (autoRefresh = true, refreshInterval = 30000) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const loadNotifications = async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await notificationsApi.getDue();
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    loadNotifications();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadNotifications();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, autoRefresh, refreshInterval]);

  const deleteNotification = async (notificationId: number) => {
    try {
      await notificationsApi.delete(notificationId);
      setNotifications(notifications.filter(n => n.notificationId !== notificationId));
    } catch (err) {
      console.error("Error deleting notification:", err);
      throw err;
    }
  };

  return {
    notifications,
    loading,
    error,
    refresh: loadNotifications,
    deleteNotification,
    unreadCount: notifications.length,
  };
};

