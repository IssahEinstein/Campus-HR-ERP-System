import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import * as feedbackApi from "../../api/feedback";
import * as timeoffApi from "../../api/timeoff";
import * as supervisorsApi from "../../api/supervisors";

const NAV_LINKS = {
  WORKER: [
    { label: "Dashboard", to: "/worker/dashboard" },
    { label: "Schedule",  to: "/worker/schedule" },
    { label: "Payroll",   to: "/worker/payroll" },
    { label: "Requests",  to: "/worker/requests" },
    { label: "Feedback",  to: "/worker/feedback" },
    { label: "Profile",   to: "/worker/profile" },
  ],
  SUPERVISOR: [
    { label: "Dashboard", to: "/supervisor/dashboard" },
    { label: "Team",      to: "/supervisor/team" },
    { label: "Schedule",  to: "/supervisor/schedule" },
    { label: "Approvals", to: "/supervisor/approvals" },
    { label: "Profile",   to: "/supervisor/profile" },
  ],
  ADMIN: [
    { label: "Dashboard", to: "/admin/dashboard" },
    { label: "Profile",   to: "/admin/profile" },
  ],
};

const API_ORIGIN = import.meta.env.VITE_API_URL || "http://localhost:8000";

function resolveAvatarUrl(value) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${API_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
}

function NavLink({ to, label }) {
  const { pathname } = useLocation();
  const active = pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={`text-sm ${
        active
          ? "nav-active-chip liquid-selectable is-selected"
          : "nav-link-idle liquid-selectable"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [seenNotificationIds, setSeenNotificationIds] = useState([]);
  const links = NAV_LINKS[user?.role] ?? [];
  const notificationPrefsKey = useMemo(() => {
    const identity = user?.user_id ?? user?.sub ?? user?.email ?? "anonymous";
    return `notifications:v1:${identity}`;
  }, [user?.user_id, user?.sub, user?.email]);

  const initials = useMemo(() => {
    const first = (user?.first_name ?? "").trim().charAt(0);
    const last = (user?.last_name ?? "").trim().charAt(0);
    const value = `${first}${last}`.toUpperCase();
    if (value) return value;

    const emailInitial = (user?.email ?? "").trim().charAt(0).toUpperCase();
    return emailInitial || "NA";
  }, [user]);
  const avatarUrl = useMemo(() => resolveAvatarUrl(user?.avatar_url), [user?.avatar_url]);
  const displayName = useMemo(() => {
    const first = (user?.first_name ?? "").trim();
    const last = (user?.last_name ?? "").trim();
    const full = `${first} ${last}`.trim();
    if (full) return full;

    if (user?.email) {
      const localPart = String(user.email).split("@")[0]?.trim();
      if (localPart) return localPart;
    }

    return "User";
  }, [user?.first_name, user?.last_name, user?.email]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(notificationPrefsKey);
      if (!raw) {
        setSeenNotificationIds([]);
        return;
      }

      const parsed = JSON.parse(raw);
      setSeenNotificationIds(Array.isArray(parsed?.seen) ? parsed.seen : []);
    } catch {
      setSeenNotificationIds([]);
    }
  }, [notificationPrefsKey]);

  useEffect(() => {
    const payload = JSON.stringify({ seen: seenNotificationIds });
    localStorage.setItem(notificationPrefsKey, payload);
  }, [seenNotificationIds, notificationPrefsKey]);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      if (!user?.role) {
        setNotifications([]);
        return;
      }

      setNotificationsLoading(true);
      try {
        if (user.role === "WORKER") {
          const [feedback, requests] = await Promise.all([
            feedbackApi.myFeedback(),
            timeoffApi.myTimeOff(),
          ]);

          const pendingRequests = requests.filter((r) => r.status === "PENDING").length;
          const items = [];
          const latestFeedbackAt = feedback.reduce((latest, item) => {
            const createdAt = item?.createdAt;
            if (!createdAt) return latest;
            if (!latest) return createdAt;
            return new Date(createdAt) > new Date(latest) ? createdAt : latest;
          }, null);

          if (feedback.length > 0) {
            items.push({
              id: `worker-feedback:${latestFeedbackAt ?? feedback.length}`,
              text: `${feedback.length} feedback item${feedback.length === 1 ? "" : "s"} available`,
              to: "/worker/feedback#feedback-list",
            });
          }
          if (pendingRequests > 0) {
            items.push({
              id: `worker-requests:${pendingRequests}`,
              text: `${pendingRequests} pending time-off request${pendingRequests === 1 ? "" : "s"}`,
              to: "/worker/requests#requests-list",
            });
          }

          if (active) setNotifications(items);
          return;
        }

        if (user.role === "SUPERVISOR") {
          const [pending, workers] = await Promise.all([
            timeoffApi.pendingTimeOff(),
            supervisorsApi.myWorkers(),
          ]);
          const invitedWorkers = workers.filter((w) => String(w.status).toUpperCase() === "INVITED").length;
          const items = [];

          if (pending.length > 0) {
            items.push({
              id: `supervisor-pending-timeoff:${pending.length}`,
              text: `${pending.length} time-off request${pending.length === 1 ? "" : "s"} awaiting review`,
              to: "/supervisor/approvals#approvals-list",
            });
          }
          if (invitedWorkers > 0) {
            items.push({
              id: `supervisor-invites:${invitedWorkers}`,
              text: `${invitedWorkers} worker invite${invitedWorkers === 1 ? "" : "s"} still pending`,
              to: "/supervisor/team#team-list",
            });
          }

          if (active) setNotifications(items);
          return;
        }

        if (user.role === "ADMIN") {
          const pending = await timeoffApi.pendingTimeOff();
          const items = pending.length > 0
            ? [{
              id: `admin-pending-timeoff:${pending.length}`,
              text: `${pending.length} time-off request${pending.length === 1 ? "" : "s"} pending review`,
              to: "/admin/dashboard#pending-approvals",
            }]
            : [];

          if (active) setNotifications(items);
        }
      } catch {
        if (active) setNotifications([]);
      } finally {
        if (active) setNotificationsLoading(false);
      }
    };

    loadNotifications();

    return () => {
      active = false;
    };
  }, [user]);

  const visibleNotifications = notifications;

  const openNotification = () => {
    setNotificationsOpen(false);
    setMobileOpen(false);
  };

  const toggleNotifications = () => {
    setNotificationsOpen((open) => {
      const nextOpen = !open;
      if (nextOpen && visibleNotifications.length > 0) {
        setSeenNotificationIds((prev) => {
          const merged = new Set(prev);
          visibleNotifications.forEach((item) => merged.add(item.id));
          return Array.from(merged);
        });
      }
      return nextOpen;
    });
  };

  const hasNotifications = visibleNotifications.length > 0;
  const hasUnreadNotifications = useMemo(
    () => visibleNotifications.some((item) => !seenNotificationIds.includes(item.id)),
    [visibleNotifications, seenNotificationIds],
  );

  return (
    <nav className="sleek-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand + desktop links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-light tracking-tight inline-flex items-center">
              <span className="ms-brand-mark" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
              Campus<span className="font-semibold text-slate-800">ERP</span>
            </Link>
            <div className="hidden md:flex items-center gap-3">
              {links.map((l) => <NavLink key={l.to} {...l} />)}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4 relative">
            <button
              onClick={toggleNotifications}
              className="p-2 soft-icon-button liquid-selectable relative"
              aria-label="Toggle notifications"
            >
              <Bell size={20} className="text-gray-600" />
              {hasUnreadNotifications && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00523E]" />}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-12 w-80 sleek-panel rounded-xl z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-800">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-auto">
                  {notificationsLoading ? (
                    <div className="px-4 py-4 text-sm text-gray-500">Loading notifications...</div>
                  ) : hasNotifications ? (
                    visibleNotifications.map((item) => (
                      <div key={item.id} className="px-3 py-2 border-b border-gray-100 last:border-b-0">
                        <Link
                          to={item.to}
                          onClick={openNotification}
                          className="block w-full text-left px-1 py-1 text-sm text-gray-700 hover:text-gray-900 rounded-md liquid-selectable"
                        >
                          {item.text}
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-sm text-gray-500">No notifications.</div>
                  )}
                </div>
              </div>
            )}

            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 p-2">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: "#00523E" }}
                  >
                    {initials.toUpperCase()}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-medium">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="text-sm text-gray-600 px-3 py-2 rounded-lg soft-ghost-button liquid-selectable"
              >
                Logout
              </button>
            </div>

            <button className="md:hidden p-2 soft-icon-button liquid-selectable" onClick={() => setMobileOpen((o) => !o)}>
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-4">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {l.label}
                </Link>
              ))}
              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900 text-left pt-2 border-t border-gray-200"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
