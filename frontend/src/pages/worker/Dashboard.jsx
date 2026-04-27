import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  DollarSign,
  Calendar,
  AlertCircle,
  ChevronRight,
  CalendarOff,
  ArrowLeftRight,
  Settings2,
  CheckCircle,
  Bell,
  MessageSquare,
  User,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import * as shiftsApi from "../../api/shifts";
import * as payrollApi from "../../api/payroll";
import * as attendanceApi from "../../api/attendance";
import * as timeoffApi from "../../api/timeoff";
import * as feedbackApi from "../../api/feedback";

const API_ORIGIN = import.meta.env.VITE_API_URL || "http://localhost:8000";

function resolveProfileImageUrl(value) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${API_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
}

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [payStubs, setPayStubs] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [requests, setRequests] = useState([]);
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      shiftsApi.myAssignments(),
      payrollApi.myPayStubs(),
      attendanceApi.myAttendance(),
      timeoffApi.myTimeOff(),
      feedbackApi.myFeedback().catch(() => []),
    ])
      .then(([a, p, attendanceData, r, f]) => {
        setAssignments(a);
        setPayStubs(Array.isArray(p) ? p : []);
        setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
        setRequests(r);
        setFeedbackItems(f);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();

  const upcoming = assignments
    .filter((a) => a.shift && new Date(a.shift.startTime) >= now)
    .sort((a, b) => new Date(a.shift.startTime) - new Date(b.shift.startTime));

  const thisWeekHrs = assignments
    .filter((a) => {
      if (!a.shift) return false;
      const d = new Date(a.shift.startTime);
      const diff = (d - now) / 864e5;
      return diff >= -7 && diff <= 7;
    })
    .reduce((sum, a) => sum + (a.shift?.expectedHours ?? 0), 0);

  const thisMonthHrs = assignments
    .filter((a) => {
      if (!a.shift) return false;
      const d = new Date(a.shift.startTime);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, a) => sum + (a.shift?.expectedHours ?? 0), 0);

  const latestStub = payStubs[0];
  const nextShift = upcoming[0]?.shift;
  const pendingReqs = requests.filter((r) => r.status === "PENDING").length;
  const approvedReqs = requests.filter((r) => r.status === "APPROVED").length;
  const profileImageUrl = resolveProfileImageUrl(user?.avatar_url);

  const ytdHoursFromStubs = payStubs.reduce(
    (sum, s) => sum + (Number(s.totalHours) || 0),
    0,
  );
  const ytdHoursFromAttendance = attendance.reduce(
    (sum, r) => sum + (Number(r.hoursWorked) || 0),
    0,
  );
  const ytdHours = ytdHoursFromStubs > 0 ? ytdHoursFromStubs : ytdHoursFromAttendance;
  const ytdNet = payStubs.reduce((sum, s) => sum + (Number(s.netPay) || 0), 0);
  const currency = (n) => `$${(Number(n) || 0).toFixed(2)}`;
  const academic = user?.worker_academic ?? null;
  const enrollmentLabel = {
    FULL_TIME: "Full-Time",
    PART_TIME: "Part-Time",
    ON_LEAVE: "On Leave",
    GRADUATED: "Graduated",
  };


  const fmt = (iso) =>
    new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    );

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
        <p className="text-gray-600">
          Here's what's happening with your campus job today.
        </p>
      </div>

      {/* Outer two-column layout: left=content, right=sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column — stat cards + main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                icon: <Clock size={32} style={{ color: "#00523E" }} />,
                label: "This Week",
                value: (
                  <>
                    {thisWeekHrs.toFixed(1)}
                    <span className="text-lg text-gray-500"> hrs</span>
                  </>
                ),
                sub: "scheduled",
              },
              {
                icon: <DollarSign size={32} style={{ color: "#00523E" }} />,
                label: "Latest Pay",
                value: latestStub
                  ? `$${Number(latestStub.netPay ?? 0).toFixed(0)}`
                  : "—",
                sub:
                  latestStub?.status === "PAID"
                    ? "paid"
                    : latestStub
                      ? "pending"
                      : "no stubs yet",
              },
              {
                icon: <Calendar size={32} style={{ color: "#00523E" }} />,
                label: "This Month",
                value: (
                  <>
                    {thisMonthHrs.toFixed(1)}
                    <span className="text-lg text-gray-500"> hrs</span>
                  </>
                ),
                sub: `${now.toLocaleDateString("en-US", { month: "short" })} total`,
              },
              {
                icon: <AlertCircle size={32} style={{ color: "#00523E" }} />,
                label: "Next Shift",
                value: nextShift
                  ? new Date(nextShift.startTime).toLocaleDateString("en-US", {
                      weekday: "short",
                    })
                  : "—",
                sub: nextShift ? fmt(nextShift.startTime) : "none scheduled",
              },
            ].map(({ icon, label, value, sub }) => (
              <div
                key={label}
                className="rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden"
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
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: "rgba(0,82,62,0.08)" }}
                >
                  {icon}
                </div>
                <div className="text-xs text-gray-500 mb-1">{label}</div>
                <div className="text-2xl font-semibold text-gray-900 mb-0.5">
                  {value}
                </div>
                <div className="text-xs text-gray-400">{sub}</div>
              </div>
            ))}
          </div>

          {/* Year to Date Summary */}
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
            <h3 className="text-sm font-medium text-gray-600 mb-4">
              {now.getFullYear()} Year to Date
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Hours</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {ytdHours.toFixed(1)}
                  <span className="text-lg text-gray-500"> hrs</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Net Earnings</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {currency(ytdNet)}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Overview */}
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
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-base font-semibold text-gray-800">
                Quick Overview
              </h2>
            </div>
            <div className="px-6 pb-6 space-y-3 mt-3">
              <div
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ backgroundColor: "rgba(0,82,62,0.04)" }}
              >
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Next Shift</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {nextShift
                      ? `${fmtDate(nextShift.startTime)} at ${fmt(nextShift.startTime)}`
                      : "No shifts scheduled"}
                  </p>
                </div>
                <Link
                  to="/worker/schedule"
                  className="text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0"
                  style={{
                    backgroundColor: "rgba(0,82,62,0.08)",
                    color: "#00523E",
                  }}
                >
                  View Schedule
                </Link>
              </div>
              <div
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ backgroundColor: "rgba(0,82,62,0.04)" }}
              >
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">
                    Latest Pay Stub
                  </p>
                  <p className="font-medium text-gray-900 text-sm">
                    {latestStub
                      ? `${latestStub.status === "PAID" ? "Paid" : "Pending"} — $${Number(latestStub.netPay ?? 0).toFixed(2)}`
                      : "No pay stubs yet"}
                  </p>
                </div>
                <Link
                  to="/worker/payroll"
                  className="text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0"
                  style={{
                    backgroundColor: "rgba(0,82,62,0.08)",
                    color: "#00523E",
                  }}
                >
                  View Payroll
                </Link>
              </div>
              <div
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ backgroundColor: "rgba(0,82,62,0.04)" }}
              >
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">
                    Time-Off Requests
                  </p>
                  <p className="font-medium text-gray-900 text-sm">
                    {pendingReqs > 0
                      ? `${pendingReqs} pending`
                      : "No pending requests"}
                  </p>
                </div>
                <Link
                  to="/worker/requests"
                  className="text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0"
                  style={{
                    backgroundColor: "rgba(0,82,62,0.08)",
                    color: "#00523E",
                  }}
                >
                  View Requests
                </Link>
              </div>
            </div>
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
              className="flex items-center justify-between px-6 py-5 border-b"
              style={{ borderColor: "rgba(0,82,62,0.09)" }}
            >
              <h2 className="text-base font-semibold text-gray-800">
                Upcoming Shifts
              </h2>
              <Link
                to="/worker/schedule"
                className="text-xs flex items-center gap-1 font-medium hover:underline"
                style={{ color: "#00523E" }}
              >
                View all <ChevronRight size={13} />
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                No upcoming shifts scheduled.
              </div>
            ) : (
              <div
                className="divide-y"
                style={{ borderColor: "rgba(0,82,62,0.07)" }}
              >
                {upcoming.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="px-6 py-4 hover:bg-white/40 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {a.shift?.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {fmtDate(a.shift?.startTime)} ·{" "}
                          {fmt(a.shift?.startTime)} – {fmt(a.shift?.endTime)}
                        </p>
                        {a.shift?.location && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {a.shift.location}
                          </p>
                        )}
                      </div>
                      <Link
                        to="/worker/schedule"
                        className="text-xs font-medium hover:underline flex-shrink-0 mt-0.5"
                        style={{ color: "#00523E" }}
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Sidebar — single tall glass card ── */}
        <div
          className="rounded-2xl overflow-hidden self-start"
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
          {/* ── Section 1: Profile ── */}
          <div className="p-6 relative overflow-hidden">
            <div
              className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, #00523E 0%, transparent 70%)",
              }}
            />
            <div className="flex flex-col items-center text-center relative z-10">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-3 ring-4 ring-white shadow-md"
                style={{
                  background:
                    "linear-gradient(135deg, #00523E 0%, #00795c 100%)",
                }}
              >
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="Profile picture"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xl font-semibold">
                    {(user?.first_name?.[0] ?? "W").toUpperCase()}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 text-base leading-tight">
                {user?.first_name ?? "Worker"} {user?.last_name ?? ""}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 capitalize">
                {user?.role?.toLowerCase() ?? "campus worker"}
              </p>
              <div
                className="mt-3 px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "rgba(0,82,62,0.08)",
                  color: "#00523E",
                }}
              >
                {now.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
            <div
              className="mt-5 pt-4 border-t grid grid-cols-3 gap-2 text-center"
              style={{ borderColor: "rgba(0,82,62,0.1)" }}
            >
              <div>
                <p
                  className="text-lg font-semibold"
                  style={{ color: "#00523E" }}
                >
                  {upcoming.length}
                </p>
                <p className="text-xs text-gray-500 leading-tight">Shifts</p>
              </div>
              <div>
                <p
                  className="text-lg font-semibold"
                  style={{ color: "#00523E" }}
                >
                  {requests.length}
                </p>
                <p className="text-xs text-gray-500 leading-tight">Requests</p>
              </div>
              <div>
                <p
                  className="text-lg font-semibold"
                  style={{ color: "#00523E" }}
                >
                  {thisWeekHrs}
                </p>
                <p className="text-xs text-gray-500 leading-tight">Hrs/wk</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            className="mx-5 border-t"
            style={{ borderColor: "rgba(0,82,62,0.09)" }}
          />

          {/* ── Section 2: Quick Actions ── */}
                    {/* ── Section 2: Academic Profile ── */}
                    {academic && (
                      <>
                        <div className="px-5 pt-5 pb-4">
                          <div className="flex items-center gap-1.5 mb-3">
                            <GraduationCap size={13} style={{ color: "#00523E" }} />
                            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Academic Profile
                            </h2>
                          </div>
                          <div className="space-y-2 text-sm">
                            {academic.student_id && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Student ID</span>
                                <span className="font-medium text-gray-800">{academic.student_id}</span>
                              </div>
                            )}
                            {academic.gpa != null && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">GPA</span>
                                <span className="font-medium text-gray-800">{Number(academic.gpa).toFixed(2)}</span>
                              </div>
                            )}
                            {academic.enrollment_status && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Enrollment</span>
                                <span
                                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{ background: "rgba(0,82,62,0.10)", color: "#00523E" }}
                                >
                                  {enrollmentLabel[academic.enrollment_status] ?? academic.enrollment_status}
                                </span>
                              </div>
                            )}
                            {academic.course_load_credits != null && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Credit Hours</span>
                                <span className="font-medium text-gray-800">{academic.course_load_credits}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mx-5 border-t" style={{ borderColor: "rgba(0,82,62,0.09)" }} />
                      </>
                    )}

                    {/* ── Section 3: Quick Actions ── */}
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Actions
            </h2>
            <div className="space-y-1">
              <Link
                to="/worker/request-time-off"
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-green-50 transition-colors group"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: "rgba(0,82,62,0.08)" }}
                >
                  <CalendarOff size={15} style={{ color: "#00523E" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    Request Time Off
                  </p>
                  <p className="text-xs text-gray-400">
                    Submit a leave request
                  </p>
                </div>
                <ChevronRight
                  size={14}
                  className="text-gray-300 group-hover:text-gray-500"
                />
              </Link>
              <Link
                to="/worker/shift-swap"
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-blue-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform bg-blue-50">
                  <ArrowLeftRight size={15} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    Swap a Shift
                  </p>
                  <p className="text-xs text-gray-400">Trade with a coworker</p>
                </div>
                <ChevronRight
                  size={14}
                  className="text-gray-300 group-hover:text-gray-500"
                />
              </Link>
              <Link
                to="/worker/update-availability"
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-purple-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform bg-purple-50">
                  <Settings2 size={15} className="text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    Update Availability
                  </p>
                  <p className="text-xs text-gray-400">Change your schedule</p>
                </div>
                <ChevronRight
                  size={14}
                  className="text-gray-300 group-hover:text-gray-500"
                />
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div
            className="mx-5 border-t"
            style={{ borderColor: "rgba(0,82,62,0.09)" }}
          />

          {/* ── Section 3: Recent Activity ── */}
          <div className="px-5 pt-5 pb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Recent Activity
              </h2>
              <Bell size={13} className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {upcoming.length > 0 && (
                <div className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "rgba(0,82,62,0.08)" }}
                  >
                    <Calendar size={13} style={{ color: "#00523E" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium leading-snug">
                      {upcoming.length} upcoming shift
                      {upcoming.length !== 1 ? "s" : ""}
                    </p>
                    <Link
                      to="/worker/schedule"
                      className="text-xs mt-0.5 hover:underline"
                      style={{ color: "#00523E" }}
                    >
                      View schedule →
                    </Link>
                  </div>
                </div>
              )}
              {approvedReqs > 0 && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-green-50">
                    <CheckCircle size={13} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium leading-snug">
                      {approvedReqs} request{approvedReqs !== 1 ? "s" : ""}{" "}
                      approved
                    </p>
                    <Link
                      to="/worker/requests"
                      className="text-xs mt-0.5 hover:underline"
                      style={{ color: "#00523E" }}
                    >
                      View requests →
                    </Link>
                  </div>
                </div>
              )}
              {feedbackItems.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-amber-50">
                    <MessageSquare size={13} className="text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium leading-snug">
                      New feedback from supervisor
                    </p>
                    <Link
                      to="/worker/feedback"
                      className="text-xs mt-0.5 hover:underline"
                      style={{ color: "#00523E" }}
                    >
                      View feedback →
                    </Link>
                  </div>
                </div>
              )}
              {latestStub && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-blue-50">
                    <DollarSign size={13} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium leading-snug">
                      Pay stub{" "}
                      {latestStub.status === "PAID" ? "paid" : "generated"} — $
                      {Number(latestStub.netPay ?? 0).toFixed(2)}
                    </p>
                    <Link
                      to="/worker/payroll"
                      className="text-xs mt-0.5 hover:underline"
                      style={{ color: "#00523E" }}
                    >
                      View payroll →
                    </Link>
                  </div>
                </div>
              )}
              {upcoming.length === 0 &&
                approvedReqs === 0 &&
                feedbackItems.length === 0 &&
                !latestStub && (
                  <p className="text-sm text-gray-400 text-center py-3">
                    No recent activity.
                  </p>
                )}
            </div>
            <div className="mt-5">
              <Link
                to="/worker/requests"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium"
                style={{
                  background:
                    "linear-gradient(135deg, #00523E 0%, #00795c 100%)",
                  color: "#fff",
                  boxShadow: "0 2px 8px rgba(0,82,62,0.25)",
                }}
              >
                <User size={14} /> My Requests
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
