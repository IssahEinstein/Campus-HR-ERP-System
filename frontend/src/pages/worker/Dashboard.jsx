import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, DollarSign, Calendar, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import * as shiftsApi from "../../api/shifts";
import * as payrollApi from "../../api/payroll";
import * as timeoffApi from "../../api/timeoff";

function StatCard({ label, value, sub, children }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 min-w-[160px] flex-shrink-0 flex flex-col items-center justify-center text-center">
      {children}
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-3xl font-light mb-1">{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [payStubs,    setPayStubs]    = useState([]);
  const [requests,    setRequests]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      shiftsApi.myAssignments(),
      payrollApi.myPayStubs(),
      timeoffApi.myTimeOff(),
    ]).then(([a, p, r]) => {
      setAssignments(a);
      setPayStubs(p);
      setRequests(r);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = assignments.filter((a) => a.shift && new Date(a.shift.startTime) >= now);
  const thisWeekHrs = assignments
    .filter((a) => {
      if (!a.shift) return false;
      const d = new Date(a.shift.startTime);
      const diff = (now - d) / 864e5;
      return diff >= 0 && diff <= 7;
    })
    .reduce((sum, a) => sum + (a.shift?.expectedHours ?? 0), 0);

  const latestStub  = payStubs[0];
  const pendingReqs = requests.filter((r) => r.status === "PENDING").length;
  const nextShift   = upcoming[0]?.shift;
  const nextShiftDate = nextShift ? new Date(nextShift.startTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "None";

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">
          Welcome back,{" "}
          <span className="font-medium" style={{ color: "#00523E" }}>
            {user?.first_name ?? "Worker"}
          </span>
        </h1>
        <p className="text-gray-600">Here's what's happening with your campus job today.</p>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <StatCard label="This Week" value={`${thisWeekHrs}`} sub="hrs scheduled">
          <Clock size={28} className="text-green-600 mb-2" />
        </StatCard>
        <StatCard
          label="Next Paycheck"
          value={latestStub?.status === "GENERATED" ? `$${Number(latestStub.netPay ?? 0).toFixed(0)}` : "—"}
          sub={latestStub?.status === "GENERATED" ? "pending approval" : "no pending stub"}
        >
          <DollarSign size={28} className="text-green-600 mb-2" />
        </StatCard>
        <StatCard label="Next Shift" value={nextShiftDate} sub={nextShift?.title ?? ""}>
          <Calendar size={28} className="text-green-600 mb-2" />
        </StatCard>
        <StatCard label="Pending Requests" value={pendingReqs} sub="awaiting review">
          <ChevronRight size={28} className="text-green-600 mb-2" />
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — upcoming shifts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Upcoming Shifts</h2>
              <Link to="/worker/schedule" className="text-sm flex items-center gap-1" style={{ color: "#00523E" }}>
                View all <ChevronRight size={16} />
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming shifts scheduled.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{a.shift?.title}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(a.shift?.startTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        {" · "}
                        {new Date(a.shift?.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" – "}
                        {new Date(a.shift?.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Link
                      to="/worker/schedule"
                      className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — quick actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/worker/request-time-off"
                className="block w-full text-center text-white px-4 py-3 rounded-lg font-medium hover:opacity-90"
                style={{ backgroundColor: "#00523E" }}
              >
                Request Time Off
              </Link>
              <Link
                to="/worker/shift-swap"
                className="block w-full text-center border border-gray-200 px-4 py-3 rounded-lg hover:border-gray-300 font-medium"
              >
                Swap Shift
              </Link>
              <Link
                to="/worker/update-availability"
                className="block w-full text-center border border-gray-200 px-4 py-3 rounded-lg hover:border-gray-300 font-medium"
              >
                Update Availability
              </Link>
            </div>
          </div>

          {requests.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Recent Requests</h2>
                <Link to="/worker/requests" className="text-xs" style={{ color: "#00523E" }}>View all</Link>
              </div>
              <div className="space-y-3">
                {requests.slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 truncate mr-2">{r.reason ?? "Time off request"}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                      r.status === "APPROVED" ? "bg-green-100 text-green-800" :
                      r.status === "REJECTED" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
