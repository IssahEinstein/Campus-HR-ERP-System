import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as supervisorsApi from "../../api/supervisors";
import * as attendanceApi   from "../../api/attendance";
import * as payrollApi      from "../../api/payroll";
import FeedbackModal from "../../components/modals/FeedbackModal";

function normalizeWorker(w) {
  const firstName = w.user?.firstName ?? w.firstName ?? "";
  const lastName = w.user?.lastName ?? w.lastName ?? "";
  return {
    ...w,
    firstName,
    lastName,
    email: w.user?.email ?? w.email ?? "",
    departmentName: w.department?.name ?? w.department ?? "",
  };
}

export default function WorkerProfile() {
  const { workerId } = useParams();
  const [worker,     setWorker]     = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [payStubs,   setPayStubs]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [feedback,   setFeedback]   = useState(false);

  useEffect(() => {
    if (!workerId) return;
    Promise.all([
      supervisorsApi.myWorkers(),
      attendanceApi.workerAttendance(workerId),
      payrollApi.workerPayStubs(workerId),
    ])
      .then(([workers, att, stubs]) => {
        const normalized = workers.map(normalizeWorker);
        setWorker(normalized.find((w) => w.id === workerId) ?? null);
        setAttendance(att);
        setPayStubs(stubs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [workerId]);

  const fmt = (iso) =>
    new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const fmtT = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const currency = (n) => `$${(Number(n) || 0).toFixed(2)}`;

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;
  if (!worker) return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-center">
      <p className="text-gray-500 mb-4">Worker not found.</p>
      <Link to="/supervisor/team" style={{ color: "#00523E" }} className="hover:underline">← Back to Team</Link>
    </div>
  );

  const initials = `${worker.firstName?.[0] ?? ""}${worker.lastName?.[0] ?? ""}`.toUpperCase();
  const ytd = payStubs.filter((s) => s.status === "PAID").reduce((sum, s) => sum + (Number(s.netPay) || 0), 0);
  const totalHrs = attendance.reduce((sum, a) => {
    if (!a.checkInTime || !a.checkOutTime) return sum;
    return sum + (new Date(a.checkOutTime) - new Date(a.checkInTime)) / 3_600_000;
  }, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link to="/supervisor/team" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Team
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: "#00523E" }}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{worker.firstName} {worker.lastName}</h1>
            {worker.email && <p className="text-gray-500">{worker.email}</p>}
            {worker.departmentName && <p className="text-sm text-gray-400">{worker.departmentName}</p>}
          </div>
        </div>
        <button
          onClick={() => setFeedback(true)}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90"
          style={{ backgroundColor: "#00523E" }}
        >
          Give Feedback
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Total Hours Worked</div>
          <div className="text-3xl font-bold text-gray-800">{totalHrs.toFixed(1)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">YTD Earnings</div>
          <div className="text-3xl font-bold" style={{ color: "#00523E" }}>{currency(ytd)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Attendance Records</div>
          <div className="text-3xl font-bold text-gray-800">{attendance.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium">Recent Attendance</h2>
          </div>
          {attendance.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No attendance records.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {attendance.slice(0, 8).map((a) => (
                <div key={a.id} className="px-6 py-3 text-sm">
                  <div className="text-gray-700">{a.checkInTime ? fmt(a.checkInTime) : "—"}</div>
                  <div className="text-gray-400 text-xs">
                    {a.checkInTime ? fmtT(a.checkInTime) : "—"} →{" "}
                    {a.checkOutTime ? fmtT(a.checkOutTime) : "not checked out"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pay stubs */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium">Pay Stubs</h2>
          </div>
          {payStubs.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No pay stubs.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {payStubs.slice(0, 8).map((s) => (
                <div key={s.id} className="px-6 py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="text-gray-700">{fmt(s.periodStart)} – {fmt(s.periodEnd)}</div>
                    <div className="text-xs text-gray-400">{(Number(s.totalHours) || 0).toFixed(1)} hrs</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-800">{currency(s.netPay)}</div>
                    <div className={`text-xs ${s.status === "PAID" ? "text-green-600" : "text-yellow-600"}`}>
                      {s.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <FeedbackModal worker={worker} onClose={() => setFeedback(false)} />
      )}
    </div>
  );
}
