import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { NotificationItem, NotificationType } from '../types';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  addLocalNotification: (item: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    senderId?: string;
    senderName?: string;
    senderAvatar?: string;
    channelId?: string;
    channelName?: string;
    taskId?: string;
    taskTitle?: string;
    projectId?: string;
    projectName?: string;
    actionUrl?: string;
  }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());
  const initialFetchDoneRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const res = await api.getNotifications();
      const fetched = res.notifications || [];
      const unread = typeof res.unreadCount === 'number' ? res.unreadCount : fetched.filter((n) => !n.isRead).length;

      // Detect new incoming notifications for current user to sound/toast
      if (initialFetchDoneRef.current) {
        const newlyReceived = fetched.filter(
          (n) => !n.isRead && !knownNotificationIdsRef.current.has(n.id) && n.userId === currentUser.id
        );
        if (newlyReceived.length > 0) {
          // Play subtle notification sound if browser allows
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
          } catch {
            // AudioContext not allowed or silent
          }
        }
      }

      fetched.forEach((n) => knownNotificationIdsRef.current.add(n.id));
      initialFetchDoneRef.current = true;

      setNotifications(fetched);
      setUnreadCount(unread);
    } catch {
      // Fallback to local storage if offline or api not reachable yet
      const key = `taskflow_notifications_${currentUser.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setNotifications(parsed);
          setUnreadCount(parsed.filter((n: NotificationItem) => !n.isRead).length);
        } catch {
          // ignore
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUser]);

  // Initial load and polling every 5 seconds
  useEffect(() => {
    initialFetchDoneRef.current = false;
    knownNotificationIdsRef.current.clear();
    setIsLoading(true);
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.markNotificationRead(id);
    } catch {
      // Local fallback
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await api.markAllNotificationsRead();
    } catch {
      // Local fallback
    }
  };

  const deleteNotification = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await api.deleteNotification(id);
    } catch {
      // Local fallback
    }
  };

  const clearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);

    try {
      await api.clearAllNotifications();
    } catch {
      // Local fallback
    }
  };

  const addLocalNotification = (item: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    senderId?: string;
    senderName?: string;
    senderAvatar?: string;
    channelId?: string;
    channelName?: string;
    taskId?: string;
    taskTitle?: string;
    projectId?: string;
    projectName?: string;
    actionUrl?: string;
  }) => {
    const newNotif: NotificationItem = {
      id: `notif-client-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...item,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    if (currentUser && item.userId === currentUser.id) {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    }

    // Also persist in localStorage for that user
    const key = `taskflow_notifications_${item.userId}`;
    try {
      const existingStr = localStorage.getItem(key);
      const list: NotificationItem[] = existingStr ? JSON.parse(existingStr) : [];
      list.unshift(newNotif);
      localStorage.setItem(key, JSON.stringify(list.slice(0, 100)));
    } catch {
      // ignore
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addLocalNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
