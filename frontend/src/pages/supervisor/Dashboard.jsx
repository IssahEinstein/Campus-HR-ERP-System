import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, ClipboardList, Clock, Calendar } from "lucide-react";
import * as supervisorsApi from "../../api/supervisors";
import * as timeoffApi from "../../api/timeoff";
import * as shiftswapApi from "../../api/shiftswap";
import * as shiftsApi from "../../api/shifts";

export default function SupervisorDashboard() {
  const [workers,  setWorkers]  = useState([]);
  const [pending,  setPending]  = useState({ timeoff: [], swaps: [] });
  const [shifts,   setShifts]   = useState([]);
  const [loading,  setLoading]  = useState(true);

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
    const end   = new Date(s.endTime);
    return start <= now && end >= now;
  });
  const upcomingShifts = shifts
    .filter((s) => new Date(s.startTime) > now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 5);
  const totalPending = pending.timeoff.length + pending.swaps.length;

  const fmt = (iso) =>
    new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const fmtT = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">
          <span className="font-medium" style={{ color: "#00523E" }}>Supervisor Dashboard</span>
        </h1>
        <p className="text-gray-600">Overview of your team and schedule.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users,         label: "Team Size",        value: workers.length,      href: "/supervisor/team" },
          { icon: Calendar,      label: "Active Shifts",    value: activeShifts.length, href: "/supervisor/schedule" },
          { icon: ClipboardList, label: "Pending Approvals",value: totalPending,        href: "/supervisor/approvals" },
          { icon: Clock,         label: "Total Shifts",     value: shifts.length,       href: "/supervisor/schedule" },
        ].map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#e6f0ec" }}>
                <item.icon size={16} style={{ color: "#00523E" }} />
              </div>
              <span className="text-sm text-gray-500">{item.label}</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">{item.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium">Pending Approvals</h2>
            {totalPending > 0 && (
              <Link to="/supervisor/approvals" className="text-sm font-medium hover:underline" style={{ color: "#00523E" }}>
                View all →
              </Link>
            )}
          </div>
          {totalPending === 0 ? (
            <div className="p-12 text-center text-gray-400">All caught up!</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {[...pending.timeoff.slice(0, 3).map((r) => ({ ...r, _type: "TIMEOFF" })),
                ...pending.swaps.slice(0, 3).map((r) => ({ ...r, _type: "SWAP" }))].slice(0, 4).map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{r._type === "TIMEOFF" ? "Time-Off Request" : "Shift Swap Request"}</div>
                    <div className="text-xs text-gray-500">
                      {r._type === "TIMEOFF"
                        ? `${fmt(r.startDate)} – ${fmt(r.endDate)}`
                        : r.reason ?? "Swap request"}
                    </div>
                  </div>
                  <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">PENDING</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Shifts */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium">Upcoming Shifts</h2>
            <Link to="/supervisor/schedule" className="text-sm font-medium hover:underline" style={{ color: "#00523E" }}>
              View all →
            </Link>
          </div>
          {upcomingShifts.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No upcoming shifts.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {upcomingShifts.map((s) => (
                <div key={s.id} className="p-4">
                  <div className="font-medium text-sm">{s.title}</div>
                  <div className="text-xs text-gray-500">
                    {fmt(s.startTime)} · {fmtT(s.startTime)} – {fmtT(s.endTime)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
