
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiUserPlus,
  FiLogIn,
  FiShoppingCart,
  FiXCircle,
  FiCheck,
  FiCheckCircle,
  FiLoader,
  FiX,
} from "react-icons/fi";
import api from "../services/api";

const getActivityIcon = (type) => {
  switch (type) {
    case "NEW_USER":
      return FiUserPlus;
    case "USER_LOGIN":
      return FiLogIn;
    case "NEW_ORDER":
      return FiShoppingCart;
    case "ORDER_CANCELLED":
      return FiXCircle;
    default:
      return FiBell;
  }
};

const getActivityColor = (type) => {
  switch (type) {
    case "NEW_USER":
      return "bg-violet-50 text-violet-600";
    case "USER_LOGIN":
      return "bg-sky-50 text-sky-600";
    case "NEW_ORDER":
      return "bg-emerald-50 text-emerald-600";
    case "ORDER_CANCELLED":
      return "bg-rose-50 text-rose-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

const formatTime = (date) => {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  return value.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function NotificationsBell({ refreshKey }) {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  // Fetch only the latest 4 notifications.
  const fetchNotifications = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setError("");

      const { data } = await api.get(
        "/admin/notifications?limit=4"
      );

      setNotifications(
        Array.isArray(data.notifications)
          ? data.notifications.slice(0, 4)
          : []
      );

      setUnreadCount(Number(data.unreadCount) || 0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load notifications."
      );
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  // Initial fetch and automatic refresh every 30 seconds.
  useEffect(() => {
    fetchNotifications(true);

    const intervalId = window.setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [fetchNotifications, refreshKey]);

  // Close the dropdown when Escape is pressed.
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const markAsRead = async (notification) => {
    if (notification.isRead) return true;

    try {
      setUpdatingId(notification._id);

      await api.patch(
        `/admin/notifications/${notification._id}/read`
      );

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? { ...item, isRead: true }
            : item
        )
      );

      setUnreadCount((count) => Math.max(0, count - 1));

      return true;
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to mark notification as read."
      );

      return false;
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNotificationClick = async (notification) => {
    const success = await markAsRead(notification);

    if (!success) return;

    setOpen(false);

    if (
      notification.type === "NEW_USER" ||
      notification.type === "USER_LOGIN"
    ) {
      navigate("/admin/users");
    } else if (
      notification.type === "NEW_ORDER" ||
      notification.type === "ORDER_CANCELLED"
    ) {
      navigate("/admin/orders");
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;

    try {
      setMarkingAll(true);
      setError("");

      await api.patch("/admin/notifications/read-all");

      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true }))
      );

      setUnreadCount(0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const dropdown = open
    ? createPortal(
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[9998] cursor-default bg-slate-950/20 sm:bg-transparent"
          />

          {/* Compact notification panel */}
          <section
            aria-label="Notifications"
            className="
              fixed z-[9999]
              left-3 right-3 top-16
              mx-auto flex
              max-h-[55dvh]
              w-auto max-w-[340px]
              flex-col overflow-hidden
              rounded-xl border border-slate-200
              bg-white text-slate-800
              shadow-[0_12px_35px_rgba(15,23,42,0.20)]
              sm:left-auto sm:right-5 sm:top-16
              sm:mx-0 sm:max-h-[400px]
            "
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-violet-50 p-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                  <FiBell size={17} />
                </div>

                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900">
                    Notifications
                  </h2>

                  <p className="text-[11px] text-slate-600">
                    {unreadCount} unread{" "}
                    {unreadCount === 1 ? "activity" : "activities"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-white hover:text-slate-900"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Mark all as read */}
            {unreadCount > 0 && (
              <div className="flex shrink-0 justify-end border-b border-slate-100 bg-white px-3 py-2">
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={markingAll}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                  {markingAll ? (
                    <FiLoader className="animate-spin" size={12} />
                  ) : (
                    <FiCheck size={13} />
                  )}

                  {markingAll ? "Updating..." : "Mark all as read"}
                </button>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex shrink-0 items-start gap-2 border-b border-rose-100 bg-rose-50 p-2.5 text-[11px] leading-4 text-rose-700">
                <span className="min-w-0 flex-1 break-words">
                  {error}
                </span>

                <button
                  type="button"
                  onClick={() => fetchNotifications(true)}
                  className="shrink-0 font-bold underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Latest 4 notifications */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white">
              {loading ? (
                <div className="flex items-center justify-center gap-2 p-6 text-xs text-slate-500">
                  <FiLoader className="animate-spin" size={16} />
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-6 text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                    <FiBell size={19} />
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    No notifications yet
                  </p>

                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    New registrations and orders will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = getActivityIcon(notification.type);
                  const isUpdating =
                    updatingId === notification._id;

                  return (
                    <button
                      key={notification._id}
                      type="button"
                      onClick={() =>
                        handleNotificationClick(notification)
                      }
                      disabled={isUpdating}
                      className={`relative flex w-full items-start gap-2 border-b border-slate-100 p-3 text-left transition-colors hover:bg-indigo-50 disabled:opacity-60 ${
                        !notification.isRead
                          ? "bg-indigo-50/70"
                          : "bg-white"
                      }`}
                    >
                      {/* Activity icon */}
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${getActivityColor(
                          notification.type
                        )}`}
                      >
                        {isUpdating ? (
                          <FiLoader
                            className="animate-spin"
                            size={15}
                          />
                        ) : (
                          <Icon size={15} />
                        )}
                      </span>

                      {/* Notification details */}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-1">
                          <span className="block break-words text-xs font-bold leading-4 text-slate-900">
                            {notification.title}
                          </span>

                          {!notification.isRead && (
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600" />
                          )}
                        </span>

                        <span className="mt-1 block whitespace-normal break-words text-[11px] leading-4 text-slate-600">
                          {notification.message}
                        </span>

                        <span className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                          <FiCheckCircle size={10} />
                          {formatTime(notification.createdAt)}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Navigate to all notifications */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/admin/notifications");
              }}
              className="shrink-0 border-t border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-xs font-bold text-indigo-700 transition hover:bg-indigo-50"
            >
              View all notifications
            </button>
          </section>
        </>,
        document.body
      )
    : null;

  return (
    <>
      {/* Bell button */}
      <div className="relative z-0 shrink-0">
        <button
          type="button"
          onClick={() => {
            const nextOpen = !open;
            setOpen(nextOpen);

            if (nextOpen) {
              fetchNotifications(true);
            }
          }}
          aria-label={`Notifications, ${unreadCount} unread`}
          aria-expanded={open}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/40 bg-white text-slate-700 shadow-sm transition hover:bg-indigo-50 hover:text-indigo-700 active:scale-95"
        >
          <FiBell size={19} />

          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-extrabold text-white ring-2 ring-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {dropdown}
    </>
  );
}
