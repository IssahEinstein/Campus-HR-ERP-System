import { useEffect, useState } from "react";
import {
  Users,
  ShieldCheck,
  Shield,
  Building2,
  Activity,
  BarChart3,
  Zap,
  RefreshCw,
} from "lucide-react";
import * as adminApi from "../../api/admin";

// Map endpoint paths to user-friendly feature names
const FEATURE_NAME_MAP = {
  "/api/admin/dashboard": "Admin Dashboard",
  "/api/admin/system/usage": "System Usage",
  "/api/admin/system/stats": "System Stats",
  "/api/admin/analytics": "Analytics",
  "/api/admin/admins": "Manage Admins",
  "/api/admin/supervisors": "Manage Supervisors",
  "/api/admin/workers": "Manage Workers",
  "/api/admin/departments": "Manage Departments",
  "/api/admin/departments/stats": "Department Stats",
  "/api/admin/payroll/by-department": "Payroll by Department",
  "/api/admin/semester-settings": "Semester Settings",
  "/api/auth/login": "Login",
  "/api/login": "Login",
  "/api/auth/logout": "Logout",
  "/api/auth/profile": "User Profile",
  "/api/auth/me": "Current User",
  "/api/auth/refresh": "Refresh Token",
  "/api/employees": "Employees",
  "/api/employees/create": "Create Employee",
  "/api/departments": "Departments",
  "/api/departments/create": "Create Department",
  "/api/payroll": "Payroll",
  "/api/payroll/my": "My Payroll",
  "/api/payroll/report": "Payroll Report",
  "/api/timeoff/pending": "Pending Time Off",
  "/api/timeoff/my": "My Time Off",
  "/api/timeoff/approve": "Approve Time Off",
  "/api/feedback/my": "My Feedback",
  "/api/feedback/create": "Submit Feedback",
  "/api/attendance/my": "My Attendance",
  "/api/availability/my": "My Availability",
  "/api/shifts": "Shifts",
  "/api/shifts/my-assignments": "My Assignments",
  "/api/shifts/create": "Create Shift",
};

const getFeatureName = (path) => {
  return FEATURE_NAME_MAP[path] || path; // Fallback to path if no mapping exists
};

const CARD_STYLE = {
  background:
    "linear-gradient(160deg, rgba(255,255,255,0.78) 0%, rgba(242,250,245,0.88) 100%)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(0,82,62,0.11)",
  boxShadow:
    "0 8px 40px rgba(0,82,62,0.09), inset 0 1px 0 rgba(255,255,255,0.95)",
};

const ICON_STYLE = {
  background: "rgba(0,82,62,0.10)",
  color: "#00523E",
};

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="rounded-2xl p-5" style={CARD_STYLE}>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={ICON_STYLE}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className="text-3xl font-semibold leading-tight" style={{ color: "#00523E" }}>
            {value}
          </p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [dashboard, setDashboard] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    const hasData = Boolean(dashboard) && Boolean(usage);
    if (!hasData) {
      setLoading(true);
    }
    setError(null);
    try {
      const [dash, usageData] = await Promise.all([
        adminApi.getDashboardSummary(),
        adminApi.getSystemUsage(),
      ]);
      setDashboard(dash);
      setUsage(usageData);
    } catch (e) {
      // Keep last successful snapshot visible instead of blanking the page.
      const errorMsg = e?.response?.data?.detail || e?.message || "Failed to load analytics.";
      console.error("Analytics load error:", e);
      setError(errorMsg);
    } finally {
      if (!hasData) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    load();
  }, []);

  const hasData = Boolean(dashboard) && Boolean(usage);

  if (loading && !hasData)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    );

  if (error && !hasData)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          className="rounded-2xl p-6 text-center"
          style={{ ...CARD_STYLE, color: "#d83b01" }}
        >
          {error}
        </div>
      </div>
    );

  const sys = dashboard?.system ?? {};
  const adminLevels = sys.admin_levels ?? {};
  const systemAdmins = adminLevels.system_admins ?? 0;
  const deptAdmins = adminLevels.department_admins ?? 0;
  const topFeatures = dashboard?.top_features ?? {};
  const allUsage = usage?.usage ?? {};
  const topFeaturesList = Object.entries(topFeatures).sort((a, b) => b[1] - a[1]);
  const allUsageList = Object.entries(allUsage).sort((a, b) => b[1] - a[1]);
  const maxHits = allUsageList.length > 0 ? allUsageList[0][1] : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-light mb-2">
            <span className="font-medium" style={{ color: "#00523E" }}>
              Analytics
            </span>{" "}
            Dashboard
          </h1>
          <p className="text-gray-600">
            System-wide overview — staff levels, feature usage, and activity.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{
            background: "rgba(0,82,62,0.08)",
            color: "#00523E",
            border: "1px solid rgba(0,82,62,0.18)",
          }}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {error && hasData ? (
        <div
          className="rounded-2xl p-4 mb-6 text-sm"
          style={{
            background: "rgba(216,59,1,0.08)",
            border: "1px solid rgba(216,59,1,0.2)",
            color: "#d83b01",
          }}
        >
          {error}
        </div>
      ) : null}

      {/* System Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          icon={<Shield size={20} />}
          label="Admins"
          value={sys.total_admins ?? 0}
          sub={`${systemAdmins} system · ${deptAdmins} dept`}
        />
        <StatCard
          icon={<Users size={20} />}
          label="Supervisors"
          value={sys.total_supervisors ?? 0}
        />
        <StatCard
          icon={<Users size={20} />}
          label="Workers"
          value={sys.total_workers ?? 0}
          sub={`${sys.active_workers ?? 0} active`}
        />
        <StatCard
          icon={<Building2 size={20} />}
          label="Departments"
          value={sys.total_departments ?? 0}
        />
        <StatCard
          icon={<Activity size={20} />}
          label="Tracked Endpoints"
          value={allUsageList.length}
        />
      </div>

      {/* Two-column: admin levels + top features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Admin Level Breakdown */}
        <div className="rounded-2xl p-6" style={CARD_STYLE}>
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck size={18} style={{ color: "#00523E" }} />
            <h2 className="text-base font-semibold text-gray-800">Admin Levels</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                label: "System Admins",
                value: systemAdmins,
                total: sys.total_admins || 1,
                desc: "Full system access, no invite required",
              },
              {
                label: "Department Admins",
                value: deptAdmins,
                total: sys.total_admins || 1,
                desc: "Scoped to one department via invite",
              },
            ].map(({ label, value, total, desc }) => {
              const pct = Math.round((value / (total || 1)) * 100);
              return (
                <div key={label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <span className="text-sm font-semibold" style={{ color: "#00523E" }}>
                      {value}
                      <span className="text-gray-400 font-normal text-xs ml-1">
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #00523E, #0d8c68)",
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 API Features */}
        <div className="rounded-2xl p-6" style={CARD_STYLE}>
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={18} style={{ color: "#00523E" }} />
            <h2 className="text-base font-semibold text-gray-800">Top Features</h2>
          </div>
          {topFeaturesList.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No feature activity recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {topFeaturesList.map(([path, count], i) => {
                const pct = Math.round((count / (topFeaturesList[0]?.[1] || 1)) * 100);
                const featureName = getFeatureName(path);
                return (
                  <div key={path}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-700 truncate max-w-[70%]">
                        {i + 1}. {featureName}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: "#00523E" }}>
                        {count} hits
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, #00523E, #0d8c68)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Full Feature Usage Table */}
      <div className="rounded-2xl p-6" style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-5">
          <Zap size={18} style={{ color: "#00523E" }} />
          <h2 className="text-base font-semibold text-gray-800">
            All Endpoint Activity
          </h2>
          <span className="ml-auto text-xs text-gray-400">Since last server start</span>
        </div>
        {allUsageList.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No endpoint activity recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 text-xs uppercase tracking-wide text-gray-500 font-medium">
                    Endpoint
                  </th>
                  <th className="text-right py-2 text-xs uppercase tracking-wide text-gray-500 font-medium">
                    Hits
                  </th>
                  <th className="text-right py-2 pl-4 text-xs uppercase tracking-wide text-gray-500 font-medium w-32">
                    Usage
                  </th>
                </tr>
              </thead>
              <tbody>
                {allUsageList.map(([path, count]) => (
                  <tr key={path} className="border-b border-gray-50 hover:bg-white/50">
                    <td className="py-2 pr-4 text-xs text-gray-700 truncate max-w-xs">
                      {getFeatureName(path)}
                    </td>
                    <td className="py-2 text-right font-semibold text-gray-800">
                      {count}
                    </td>
                    <td className="py-2 pl-4">
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round((count / maxHits) * 100)}%`,
                            background: "linear-gradient(90deg, #00523E, #0d8c68)",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
