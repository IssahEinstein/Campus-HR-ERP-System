import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  ClipboardList,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Repeat,
} from "lucide-react";
import * as supervisorsApi from "../../api/supervisors";
import * as timeoffApi from "../../api/timeoff";
import * as shiftswapApi from "../../api/shiftswap";
import * as shiftsApi from "../../api/shifts";

export default function SupervisorDashboard() {
  const [workers, setWorkers] = useState([]);
  const [pending, setPending] = useState({ timeoff: [], swaps: [] });
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supervisorsApi.myWorkers(),
      timeoffApi.pendingTimeOff(),
      shiftswapApi.pendingSwaps(),
      shiftsApi.listShifts(),
    ])
      .then(([w, to, sw, sh]) => {
        setWorkers(w);
        setPending({ timeoff: to, swaps: sw });
        setShifts(sh);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const activeShifts = shifts.filter((s) => {
    const start = new Date(s.startTime);
    const end = new Date(s.endTime);
    return start <= now && end >= now;
  });
  const upcomingShifts = shifts
    .filter((s) => new Date(s.startTime) > now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 5);

  const allPending = [
    ...pending.timeoff.map((r) => ({ ...r, _type: "TIMEOFF" })),
    ...pending.swaps.map((r) => ({ ...r, _type: "SWAP" })),
  ];
  const totalPending = allPending.length;

  const fmt = (iso) =>
    new Date(iso).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  const fmtT = (iso) =>
    new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">
          <span className="font-medium" style={{ color: "#00523E" }}>
            Supervisor
          </span>{" "}
          Dashboard
        </h1>
        <p className="text-gray-600">Manage your team and approve requests.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: <Users size={20} />,
            label: "Team Size",
            value: workers.length,
          },
          {
            icon: <Clock size={20} />,
            label: "Active Shifts",
            value: activeShifts.length,
          },
          {
            icon: <AlertCircle size={20} />,
            label: "Pending",
            value: totalPending,
          },
          {
            icon: <Calendar size={20} />,
            label: "Total Shifts",
            value: shifts.length,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-5"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.78) 0%, rgba(242,250,245,0.88) 100%)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(0,82,62,0.11)",
              boxShadow:
                "0 8px 40px rgba(0,82,62,0.09), inset 0 1px 0 rgba(255,255,255,0.95)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,82,62,0.10)", color: "#00523E" }}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  {stat.label}
                </p>
                <p
                  className="text-3xl font-semibold leading-tight"
                  style={{ color: "#00523E" }}
                >
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Main — left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Approvals */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.78) 0%, rgba(242,250,245,0.88) 100%)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(0,82,62,0.11)",
              boxShadow:
                "0 8px 40px rgba(0,82,62,0.09), inset 0 1px 0 rgba(255,255,255,0.95)",
            }}
          >
            <div
              className="p-6 border-b flex items-center justify-between"
              style={{ borderColor: "rgba(0,82,62,0.09)" }}
            >
              <h2 className="text-lg font-semibold">Pending Approvals</h2>
              {totalPending > 0 && (
                <Link
                  to="/supervisor/approvals"
                  className="text-sm font-medium hover:underline"
                  style={{ color: "#00523E" }}
                >
                  View all →
                </Link>
              )}
            </div>
            {totalPending === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <CheckCircle size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No pending approvals</p>
              </div>
            ) : (
              <div
                className="divide-y"
                style={{ borderColor: "rgba(0,82,62,0.07)" }}
              >
                {allPending.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="p-6 hover:bg-white/40 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {r._type === "TIMEOFF" ? (
                            <Calendar size={16} className="text-blue-600" />
                          ) : (
                            <Repeat size={16} className="text-purple-600" />
                          )}
                          <h3 className="font-medium text-sm">
                            {r._type === "TIMEOFF"
                              ? "Time-Off Request"
                              : "Shift Swap Request"}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {r._type === "TIMEOFF"
                            ? `${fmt(r.startDate)} – ${fmt(r.endDate)}`
                            : (r.reason ?? "Swap request")}
                        </p>
                        <p className="text-xs text-gray-400">
                          Received {fmt(r.createdAt)}
                        </p>
                      </div>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                        PENDING
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Shifts */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.78) 0%, rgba(242,250,245,0.88) 100%)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(0,82,62,0.11)",
              boxShadow:
                "0 8px 40px rgba(0,82,62,0.09), inset 0 1px 0 rgba(255,255,255,0.95)",
            }}
          >
            <div
              className="p-6 border-b flex items-center justify-between"
              style={{ borderColor: "rgba(0,82,62,0.09)" }}
            >
              <h2 className="text-lg font-semibold">Upcoming Shifts</h2>
              <Link
                to="/supervisor/schedule"
                className="text-sm font-medium hover:underline"
                style={{ color: "#00523E" }}
              >
                View all →
              </Link>
            </div>
            {upcomingShifts.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No upcoming shifts.</p>
              </div>
            ) : (
              <div
                className="divide-y"
                style={{ borderColor: "rgba(0,82,62,0.07)" }}
              >
                {upcomingShifts.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 flex items-center justify-between hover:bg-white/40 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm">{s.title}</div>
                      <div className="text-xs text-gray-500">
                        {fmt(s.startTime)} · {fmtT(s.startTime)} –{" "}
                        {fmtT(s.endTime)}
                      </div>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                      Upcoming
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div
            className="rounded-2xl p-6"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.78) 0%, rgba(242,250,245,0.88) 100%)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(0,82,62,0.11)",
              boxShadow:
                "0 8px 40px rgba(0,82,62,0.09), inset 0 1px 0 rgba(255,255,255,0.95)",
            }}
          >
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/supervisor/schedule"
                className="w-full text-white px-4 py-3 rounded-xl transition-colors text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#00523E" }}
              >
                <Plus size={18} />
                Create Shift
              </Link>
              <Link
                to="/supervisor/team"
                className="w-full px-4 py-3 rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2"
                style={{
                  border: "1px solid rgba(0,82,62,0.18)",
                  color: "#00523E",
                }}
              >
                <Users size={18} />
                Manage Team
              </Link>
              <Link
                to="/supervisor/approvals"
                className="w-full px-4 py-3 rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2"
                style={{
                  border: "1px solid rgba(0,82,62,0.18)",
                  color: "#00523E",
                }}
              >
                <ClipboardList size={18} />
                Review Requests
              </Link>
            </div>
          </div>

          {/* Team Summary */}
          <div
            className="rounded-2xl p-6"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.78) 0%, rgba(242,250,245,0.88) 100%)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(0,82,62,0.11)",
              boxShadow:
                "0 8px 40px rgba(0,82,62,0.09), inset 0 1px 0 rgba(255,255,255,0.95)",
            }}
          >
            <h2 className="text-lg font-semibold mb-4">Team Summary</h2>
            <div className="space-y-3">
              {[
                { label: "Active Workers", value: workers.length },
                { label: "Active Shifts Now", value: activeShifts.length },
                { label: "Pending Requests", value: totalPending },
                { label: "Upcoming Shifts", value: upcomingShifts.length },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between items-center text-sm px-3 py-2 rounded-xl"
                  style={{ backgroundColor: "rgba(0,82,62,0.04)" }}
                >
                  <span className="text-gray-600">{row.label}</span>
                  <span className="font-semibold" style={{ color: "#00523E" }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
