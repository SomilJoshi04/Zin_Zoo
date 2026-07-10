import { useCallback, useEffect, useMemo, useState } from "react";
import { adminAPI, groceryAdminAPI, accessoriesAdminAPI } from "@food/api";

const STORAGE_KEY = "admin_notifications_dismissed_v1";
const UPDATE_EVENT = "adminNotificationsUpdated";

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getDismissedIds = () => {
  if (typeof localStorage === "undefined") return [];
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY) || "[]", []);
  return Array.isArray(parsed) ? parsed : [];
};

const saveDismissedIds = (ids) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(ids) ? ids : []));
};

export const dispatchAdminNotificationsUpdated = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(UPDATE_EVENT));
};

const toDateValue = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
};

const toDateLabel = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const uniqueById = (items = []) => {
  const map = new Map();
  for (const item of items) {
    if (!item?.id) continue;
    map.set(item.id, item);
  }
  return [...map.values()];
};

const joinMeta = (...parts) => parts.filter(Boolean).join(" • ");

const mapPendingRestaurants = (rows = []) =>
  (Array.isArray(rows) ? rows : []).map((item) => ({
    id: `approval-restaurant-${String(item?._id || item?.id || "")}`,
    title: "Restaurant Approval Pending",
    message: `${item?.restaurantName || "Restaurant"} submitted a restaurant approval request. Owner: ${item?.ownerName || "N/A"}. Contact: ${item?.ownerPhone || "N/A"}.`,
    type: "approval",
    category: "restaurant_approval",
    path: "/admin/food/restaurants/joining-request",
    createdAt: item?.createdAt || item?.updatedAt,
    timeLabel: toDateLabel(item?.createdAt || item?.updatedAt),
    metaLabel: joinMeta(item?.restaurantName, item?.ownerName, item?.ownerPhone),
  }));

const mapDeliveryJoinRequests = (response) => {
  const payload = response?.data?.data;
  const rows =
    payload?.partners ||
    payload?.data ||
    payload?.items ||
    response?.data?.partners ||
    [];

  return (Array.isArray(rows) ? rows : []).map((item) => ({
    id: `approval-delivery-${String(item?._id || item?.id || "")}`,
    title: "Delivery Partner Approval Pending",
    message: `${item?.name || "Delivery partner"} submitted a joining request. Phone: ${item?.phone || "N/A"}. Email: ${item?.email || "N/A"}.`,
    type: "approval",
    category: "delivery_approval",
    path: "/admin/food/delivery-partners/join-request",
    createdAt: item?.createdAt || item?.updatedAt,
    timeLabel: toDateLabel(item?.createdAt || item?.updatedAt),
    metaLabel: joinMeta(item?.name, item?.phone, item?.email),
  }));
};

const mapFoodApprovals = (response) => {
  const payload = response?.data?.data;
  const rows =
    payload?.requests ||
    payload?.items ||
    payload?.data ||
    response?.data?.requests ||
    [];

  return (Array.isArray(rows) ? rows : []).map((item) => ({
    id: `approval-food-${String(item?._id || item?.id || "")}`,
    title: "Food Approval Pending",
    message: `${item?.itemName || "Food item"} from ${item?.restaurantName || "Restaurant"} is waiting for review. Category: ${item?.category || item?.type || "N/A"}.`,
    type: "approval",
    category: "food_approval",
    path: "/admin/food/food-approval",
    createdAt: item?.requestedAt || item?.createdAt || item?.updatedAt,
    timeLabel: toDateLabel(item?.requestedAt || item?.createdAt || item?.updatedAt),
    metaLabel: joinMeta(item?.restaurantName, item?.itemName, item?.category || item?.type),
  }));
};

const mapUserRestaurantSupport = (response) => {
  const payload = response?.data?.data;
  const rows =
    payload?.tickets ||
    payload?.items ||
    payload?.data ||
    response?.data?.tickets ||
    [];

  return (Array.isArray(rows) ? rows : [])
    .filter((item) => !["resolved", "closed"].includes(String(item?.status || "").toLowerCase()))
    .map((item) => {
      const isRestaurantTicket = item?.source === "restaurant";
      const title = isRestaurantTicket ? "Restaurant Support Ticket" : "User Support Ticket";
      const message = isRestaurantTicket
        ? `${item?.restaurantName || "Restaurant"} raised a support ticket. Subject: ${item?.subject || item?.issueType || "N/A"}. Status: ${item?.status || "open"}.`
        : `${item?.user?.name || "User"} raised a support ticket${item?.restaurantName ? ` for ${item.restaurantName}` : ""}. Issue: ${item?.issueType || item?.type || "N/A"}. Status: ${item?.status || "open"}.`;

      const metaLabel = isRestaurantTicket
        ? joinMeta(item?.restaurantName, item?.subject || item?.issueType, item?.status)
        : joinMeta(item?.user?.name, item?.user?.phone, item?.issueType || item?.type, item?.status);

      return {
        id: `support-main-${String(item?._id || item?.id || "")}`,
        title,
        message,
        type: "support",
        category: "support",
        path: "/admin/food/support-tickets",
        createdAt: item?.createdAt || item?.updatedAt,
        timeLabel: toDateLabel(item?.createdAt || item?.updatedAt),
        metaLabel,
      };
    });
};

const mapDeliverySupport = (response) => {
  const payload = response?.data?.data;
  const rows =
    payload?.tickets ||
    payload?.items ||
    payload?.data ||
    response?.data?.tickets ||
    [];

  return (Array.isArray(rows) ? rows : [])
    .filter((item) => !["resolved", "closed"].includes(String(item?.status || "").toLowerCase()))
    .map((item) => ({
      id: `support-delivery-${String(item?._id || item?.id || "")}`,
      title: "Delivery Support Ticket",
      message: `${item?.deliveryPartner?.name || "Delivery partner"} raised a support ticket. Subject: ${item?.subject || "N/A"}. Priority: ${item?.priority || "medium"}. Status: ${item?.status || "open"}.`,
      type: "support",
      category: "delivery_support",
      path: "/admin/food/delivery-support-tickets",
      createdAt: item?.createdAt || item?.updatedAt,
      timeLabel: toDateLabel(item?.createdAt || item?.updatedAt),
      metaLabel: joinMeta(item?.deliveryPartner?.name, item?.deliveryPartner?.phone, item?.priority, item?.status),
    }));
};

const mapExpiredFssai = (response) => {
  const payload = response?.data?.data;
  const rows = payload?.items || payload?.data || response?.data?.items || [];

  return (Array.isArray(rows) ? rows : []).map((item) => ({
    id: String(item?.id || `fssai-expired-${item?.restaurantId || ""}`),
    title: item?.title || "FSSAI License Expired",
    message:
      item?.message ||
      `${item?.restaurantName || "Restaurant"} FSSAI license has expired.`,
    type: "compliance",
    category: "fssai_expired",
    path: "/admin/food/restaurants",
    createdAt: item?.createdAt || item?.fssaiExpiry,
    timeLabel: toDateLabel(item?.createdAt || item?.fssaiExpiry),
    metaLabel: joinMeta(item?.restaurantName, item?.ownerName, item?.ownerPhone, item?.fssaiNumber),
  }));
};

const mapPendingOrders = (rows = [], moduleType = "food") => {
  const list = Array.isArray(rows) ? rows : (rows?.orders || rows?.docs || rows?.data || []);
  return (Array.isArray(list) ? list : []).map((item) => {
    const totalAmount = item?.pricing?.total ?? item?.totalAmount ?? 0;
    const orderId = item?.orderId ?? item?.id ?? item?._id ?? "N/A";
    const customer = item?.customerName ?? item?.userId?.name ?? item?.userId?.fullName ?? "Customer";
    
    let path = "/admin/food/orders";
    if (moduleType === "grocery") path = "/admin/food/grocery-orders";
    if (moduleType === "accessories") path = "/admin/food/accessories-orders";

    return {
      id: `pending-order-${String(item?._id || item?.id || "")}`,
      title: `New ${moduleType === "food" ? "Food" : (moduleType === "grocery" ? "Grocery" : "Accessories")} Order`,
      message: `Order #${orderId} was placed. Total: ₹${Number(totalAmount).toFixed(2)}. Status: Pending.`,
      type: "order",
      category: "pending_order",
      path,
      createdAt: item?.createdAt || item?.updatedAt,
      timeLabel: toDateLabel(item?.createdAt || item?.updatedAt),
      metaLabel: joinMeta(orderId, customer, `₹${Number(totalAmount).toFixed(2)}`),
    };
  });
};

export default function useAdminNotifications(options = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(options?.autoload !== false));

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const dismissed = new Set(getDismissedIds());

      const [
        restaurantsRes,
        deliveryJoinRes,
        foodApprovalRes,
        supportRes,
        deliverySupportRes,
        fssaiExpiredRes,
        foodOrdersRes,
        groceryOrdersRes,
        accessoriesOrdersRes,
      ] = await Promise.all([
        adminAPI.getPendingRestaurants().catch(() => null),
        adminAPI.getDeliveryPartnerJoinRequests({ page: 1, limit: 50 }).catch(() => null),
        adminAPI.getPendingFoodApprovals({ page: 1, limit: 50 }).catch(() => null),
        adminAPI.getSupportTicketsAdmin({ page: 1, limit: 50, source: "all" }).catch(() => null),
        adminAPI.getDeliverySupportTickets({ page: 1, limit: 50 }).catch(() => null),
        adminAPI.getExpiredFssaiNotifications().catch(() => null),
        adminAPI.getOrders({ status: "pending", limit: 20 }).catch(() => null),
        groceryAdminAPI.getOrders({ status: "pending", limit: 20 }).catch(() => null),
        accessoriesAdminAPI.getOrders({ status: "pending", limit: 20 }).catch(() => null),
      ]);

      const restaurantRows =
        restaurantsRes?.data?.data ||
        restaurantsRes?.data?.restaurants ||
        [];

      const foodOrdersRows = foodOrdersRes?.data?.data?.data || foodOrdersRes?.data?.data?.orders || foodOrdersRes?.data?.orders || foodOrdersRes?.data?.data?.docs || foodOrdersRes?.data?.data || [];
      const groceryOrdersRows = groceryOrdersRes?.data?.data?.orders || groceryOrdersRes?.data?.orders || groceryOrdersRes?.data?.data?.docs || groceryOrdersRes?.data?.data || [];
      const accessoriesOrdersRows = accessoriesOrdersRes?.data?.data?.orders || accessoriesOrdersRes?.data?.orders || accessoriesOrdersRes?.data?.data?.docs || accessoriesOrdersRes?.data?.data || [];

      const aggregated = uniqueById([
        ...mapPendingOrders(foodOrdersRows, "food"),
        ...mapPendingOrders(groceryOrdersRows, "grocery"),
        ...mapPendingOrders(accessoriesOrdersRows, "accessories"),
        ...mapPendingRestaurants(restaurantRows),
        ...mapDeliveryJoinRequests(deliveryJoinRes),
        ...mapFoodApprovals(foodApprovalRes),
        ...mapUserRestaurantSupport(supportRes),
        ...mapDeliverySupport(deliverySupportRes),
        ...mapExpiredFssai(fssaiExpiredRes),
      ])
        .filter((item) => !dismissed.has(item.id))
        .sort((a, b) => toDateValue(b.createdAt) - toDateValue(a.createdAt));

      setItems(aggregated);
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

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadNotifications();
    }, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  const dismissOne = useCallback((id) => {
    if (!id) return;
    const dismissed = [...new Set([...getDismissedIds(), id])];
    saveDismissedIds(dismissed);
    setItems((prev) => prev.filter((item) => item.id !== id));
    dispatchAdminNotificationsUpdated();
  }, []);

  const clearAll = useCallback(() => {
    const ids = items.map((item) => item.id).filter(Boolean);
    saveDismissedIds([...new Set([...getDismissedIds(), ...ids])]);
    setItems([]);
    dispatchAdminNotificationsUpdated();
  }, [items]);

  return useMemo(
    () => ({
      items,
      loading,
      unreadCount: items.length,
      refresh: loadNotifications,
      dismissOne,
      clearAll,
    }),
    [clearAll, dismissOne, items, loadNotifications, loading]
  );
}
