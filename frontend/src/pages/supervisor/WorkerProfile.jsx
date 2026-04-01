import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import * as supervisorsApi from "../../api/supervisors";
import * as attendanceApi from "../../api/attendance";
import * as payrollApi from "../../api/payroll";
import * as availabilityApi from "../../api/availability";
import * as timeoffApi from "../../api/timeoff";
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
  const [worker, setWorker] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [payStubs, setPayStubs] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [approvedTimeOff, setApprovedTimeOff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(false);

  const fetchAttendance = useCallback(() => {
    if (!workerId) return;
    attendanceApi.workerAttendance(workerId)
      .then(setAttendance)
      .catch(console.error);
  }, [workerId]);

  useEffect(() => {
    if (!workerId) return;
    Promise.all([
      supervisorsApi.myWorkers(),
      attendanceApi.workerAttendance(workerId),
      payrollApi.workerPayStubs(workerId),
      availabilityApi.workerAvailability(workerId),
      timeoffApi.workerTimeOff(workerId),
    ])
      .then(([workers, att, stubs, slots, requests]) => {
        const normalized = workers.map(normalizeWorker);
        setWorker(normalized.find((w) => w.id === workerId) ?? null);
        setAttendance(att);
        setPayStubs(stubs);
        setAvailability(slots);
        setApprovedTimeOff(
          requests.filter((request) => String(request.status) === "APPROVED"),
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [workerId]);

  // Poll attendance every 30 s so checkout times appear without a full page reload
  useEffect(() => {
    const id = setInterval(fetchAttendance, 30_000);
    return () => clearInterval(id);
  }, [fetchAttendance]);

  const fmt = (iso) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  const fmtT = (iso) =>
    new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  const currency = (n) => `$${(Number(n) || 0).toFixed(2)}`;
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const fmtDateTime = (iso) =>
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    );
  if (!worker)
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <p className="text-gray-500 mb-4">Worker not found.</p>
        <Link
          to="/supervisor/team"
          style={{ color: "#00523E" }}
          className="hover:underline"
        >
          ← Back to Team
        </Link>
      </div>
    );

  const initials =
    `${worker.firstName?.[0] ?? ""}${worker.lastName?.[0] ?? ""}`.toUpperCase();
  const ytd = payStubs
    .filter((s) => s.status === "PAID")
    .reduce((sum, s) => sum + (Number(s.netPay) || 0), 0);
  const totalHrs = attendance.reduce((sum, a) => {
    if (!a.checkInTime || !a.checkOutTime) return sum;
    return (
      sum + (new Date(a.checkOutTime) - new Date(a.checkInTime)) / 3_600_000
    );
  }, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link
          to="/supervisor/team"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Team
        </Link>
      </div>

      {/* Header */}
      <div
        className="rounded-2xl p-6 mb-6 flex flex-wrap gap-4 items-center justify-between"
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
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: "#00523E" }}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">
              {worker.firstName} {worker.lastName}
            </h1>
            {worker.email && <p className="text-gray-500">{worker.email}</p>}
            {worker.departmentName && (
              <p className="text-sm text-gray-400">{worker.departmentName}</p>
            )}
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
        {[
          {
            label: "Total Hours Worked",
            value: totalHrs.toFixed(1),
            color: "text-gray-800",
          },
          {
            label: "YTD Earnings",
            value: currency(ytd),
            color: undefined,
            style: { color: "#00523E" },
          },
          {
            label: "Attendance Records",
            value: attendance.length,
            color: "text-gray-800",
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
            <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
            <div
              className={`text-3xl font-bold ${stat.color ?? ""}`}
              style={stat.style}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            className="p-6 border-b"
            style={{ borderColor: "rgba(0,82,62,0.09)" }}
          >
            <h2 className="text-lg font-semibold">Availability</h2>
          </div>
          {availability.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No availability set.
            </div>
          ) : (
            <div
              className="divide-y"
              style={{ borderColor: "rgba(0,82,62,0.07)" }}
            >
              {availability.map((slot) => (
                <div key={slot.id} className="px-6 py-3 text-sm">
                  <div className="text-gray-700">
                    {dayNames[slot.dayOfWeek] ?? "Day"} {slot.startTime} - {slot.endTime}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div
            className="p-6 border-t"
            style={{ borderColor: "rgba(0,82,62,0.09)" }}
          >
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Approved Time-Off</h3>
            {approvedTimeOff.length === 0 ? (
              <p className="text-sm text-gray-400">No approved time-off requests.</p>
            ) : (
              <div className="space-y-2">
                {approvedTimeOff.map((request) => (
                  <div key={request.id} className="text-sm text-gray-600">
                    {fmtDateTime(request.startDate)} to {fmtDateTime(request.endDate)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Attendance */}
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
            className="p-6 border-b"
            style={{ borderColor: "rgba(0,82,62,0.09)" }}
          >
            <h2 className="text-lg font-semibold">Recent Attendance</h2>
          </div>
          {attendance.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No attendance records.
            </div>
          ) : (
            <div
              className="divide-y"
              style={{ borderColor: "rgba(0,82,62,0.07)" }}
            >
              {attendance.slice(0, 8).map((a) => (
                <div
                  key={a.id}
                  className="px-6 py-3 text-sm hover:bg-white/40 transition-colors"
                >
                  <div className="text-gray-700">
                    {a.shiftTitle ?? "Unknown Shift"} &mdash;{" "}
                    {a.checkedInAt ? fmt(a.checkedInAt) : "—"}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {a.checkedInAt ? fmtT(a.checkedInAt) : "—"} →{" "}
                    {a.checkedOutAt ? fmtT(a.checkedOutAt) : "not checked out"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pay stubs */}
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
            className="p-6 border-b"
            style={{ borderColor: "rgba(0,82,62,0.09)" }}
          >
            <h2 className="text-lg font-semibold">Pay Stubs</h2>
          </div>
          {payStubs.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No pay stubs.
            </div>
          ) : (
            <div
              className="divide-y"
              style={{ borderColor: "rgba(0,82,62,0.07)" }}
            >
              {payStubs.slice(0, 8).map((s) => (
                <div
                  key={s.id}
                  className="px-6 py-3 flex items-center justify-between text-sm hover:bg-white/40 transition-colors"
                >
                  <div>
                    <div className="text-gray-700">
                      {fmt(s.payPeriodStart)} – {fmt(s.payPeriodEnd)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {(Number(s.totalHours) || 0).toFixed(1)} hrs
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-800">
                      {currency(s.netPay)}
                    </div>
                    <div
                      className={`text-xs ${s.status === "PAID" ? "text-green-600" : "text-yellow-600"}`}
                    >
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
