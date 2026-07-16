import { Bell, Clock, Loader2, Trash2, X, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAdminNotifications from "@food/hooks/useAdminNotifications";

export default function AdminNotifications() {
  const navigate = useNavigate();
  const { items, unreadCount, loading, clearAll, dismissOne } = useAdminNotifications();
  
  const handleMarkAllAsRead = async () => {
    try {
      const { adminAPI } = await import("@food/api");
      await adminAPI.markAllAdminNotificationsAsRead();
      window.dispatchEvent(new Event("adminNotificationsUpdated"));
    } catch (err) {}
  };

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-slate-900/50 dark:backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Approval and support alerts that need admin attention.
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500" />
                  Mark all as read
                </button>
              )}
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-2 rounded-2xl border border-red-200 dark:border-red-950/40 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear all
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            Loading notifications...
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-sm text-slate-500 dark:text-slate-400">No notifications found.</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item?.id}
                className={`rounded-2xl border px-4 py-4 transition-all duration-200 ${
                  item.isRead 
                    ? 'border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30' 
                    : 'border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/15'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!item.isRead) dismissOne(item?.id);
                      if (item?.path) {
                        let targetPath = item.path;
                        if (targetPath === '/admin/food/orders') targetPath = '/admin/food/orders/all';
                        if (targetPath === '/admin/food/grocery-orders') targetPath = '/admin/food/grocery-orders/all';
                        if (targetPath === '/admin/food/accessories-orders') targetPath = '/admin/food/accessories-orders/all';
                        navigate(targetPath);
                      }
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {!item.isRead && <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />}
                      <p className={`text-base text-slate-900 dark:text-slate-100 ${item.isRead ? 'font-medium' : 'font-bold'}`}>
                        {item?.title || "Notification"}
                      </p>
                    </div>
                    <p className={`text-sm mt-1 ${item.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300 font-medium'}`}>
                      {item?.message || "-"}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item?.timeLabel || "N/A"}</span>
                      {item?.metaLabel ? (
                        <>
                          <span>•</span>
                          <span>{item.metaLabel}</span>
                        </>
                      ) : null}
                    </div>
                  </button>
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => dismissOne(item?.id)}
                      className="shrink-0 rounded-full p-2 text-slate-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                      aria-label="Mark as read"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
