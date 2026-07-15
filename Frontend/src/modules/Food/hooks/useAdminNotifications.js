import { useCallback, useEffect, useMemo, useState } from "react";
import { adminAPI } from "@food/api";

const UPDATE_EVENT = "adminNotificationsUpdated";

export const dispatchAdminNotificationsUpdated = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(UPDATE_EVENT));
};

export default function useAdminNotifications(options = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(options?.autoload !== false));

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getAdminNotificationsHistory({ page: 1, limit: 50 });
      const notifications = res?.data?.data?.notifications || res?.data?.notifications || [];
      
      const mapped = notifications.map(n => ({
        id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        category: n.category,
        path: n.link || "#",
        createdAt: n.createdAt,
        isRead: n.isRead,
        timeLabel: new Date(n.createdAt).toLocaleString("en-IN", {
          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true
        }),
        metaLabel: n.metaData ? (n.metaData.orderId || n.metaData.userName || n.category) : n.category
      }));
      setItems(mapped);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (options?.autoload === false) return;
    loadNotifications();
  }, [loadNotifications, options?.autoload]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handler = () => {
      loadNotifications();
    };
    window.addEventListener(UPDATE_EVENT, handler);
    return () => window.removeEventListener(UPDATE_EVENT, handler);
  }, [loadNotifications]);

  const dismissOne = useCallback(async (id) => {
    if (!id) return;
    try {
      await adminAPI.markAdminNotificationAsRead(id);
      setItems((prev) => prev.map(item => item.id === id ? { ...item, isRead: true } : item));
      dispatchAdminNotificationsUpdated();
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await adminAPI.clearAllAdminNotifications();
      setItems([]);
      dispatchAdminNotificationsUpdated();
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  }, []);

  const unreadCount = useMemo(() => items.filter(i => !i.isRead).length, [items]);

  return useMemo(
    () => ({
      items,
      loading,
      unreadCount,
      refresh: loadNotifications,
      dismissOne,
      clearAll,
    }),
    [clearAll, dismissOne, items, loadNotifications, loading, unreadCount]
  );
}
