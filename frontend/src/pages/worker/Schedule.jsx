import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ChevronRight, Calendar } from "lucide-react";
import * as shiftsApi from "../../api/shifts";
import * as availabilityApi from "../../api/availability";
import ShiftDetailsModal from "../../components/modals/ShiftDetailsModal";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WorkerSchedule() {
  const [assignments, setAssignments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([shiftsApi.myAssignments(), availabilityApi.myAvailability()])
      .then(([a, av]) => {
        setAssignments(a);
        setAvailability(av);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const applyAttendanceRecord = (record) => {
    if (!selected || !record) {
      return;
    }

    const assignmentId = selected.id;
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              checkInRecord: record,
            }
          : a,
      ),
    );

    setSelected((prev) =>
      prev && prev.id === assignmentId
        ? {
            ...prev,
            checkInRecord: record,
          }
        : prev,
    );
  };

  const now = new Date();

  const upcoming = assignments
    .filter((a) => a.shift && new Date(a.shift.endTime) >= now)
    .sort((a, b) => new Date(a.shift.startTime) - new Date(b.shift.startTime));

  const past = assignments
    .filter((a) => a.shift && new Date(a.shift.endTime) < now)
    .sort((a, b) => new Date(b.shift.startTime) - new Date(a.shift.startTime));

  // Build a 7-day week grid starting from today
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const dateNum = d.getDate();
    const shiftsOnDay = upcoming.filter((a) => {
      const sd = new Date(a.shift.startTime);
      return sd.getDate() === d.getDate() && sd.getMonth() === d.getMonth();
    });
    return {
      dayName,
      dateNum,
      shifts: shiftsOnDay.length,
      hours: shiftsOnDay.reduce((s, a) => s + (a.shift?.expectedHours ?? 0), 0),
    };
  });

  const totalWeekHrs = weekDays.reduce((s, d) => s + d.hours, 0);

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
        Loading…
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">
          <span className="font-medium" style={{ color: "#00523E" }}>
            Schedule
          </span>
        </h1>
        <p className="text-gray-600">Manage your shifts and availability.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
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
              <a
                href="#"
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                View all <ChevronRight size={16} />
              </a>
            </div>
            {upcoming.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                No upcoming shifts scheduled.
              </div>
            ) : (
              <div
                className="divide-y"
                style={{ borderColor: "rgba(0,82,62,0.07)" }}
              >
                {upcoming.map((a) => (
                  <div
                    key={a.id}
                    className="p-6 hover:bg-white/40 transition-colors cursor-pointer"
                    onClick={() => setSelected(a)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin size={16} className="text-gray-400" />
                          <h3 className="font-medium">{a.shift.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          {fmtDate(a.shift.startTime)} ·{" "}
                          {fmt(a.shift.startTime)} – {fmt(a.shift.endTime)}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          a.status === "ACCEPTED" || a.status === "ASSIGNED"
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {a.status === "ASSIGNED"
                          ? "confirmed"
                          : a.status.toLowerCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{a.shift.location ?? ""}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(a);
                        }}
                        className="hover:underline"
                        style={{ color: "#00523E" }}
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Overview */}
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
            <h2 className="text-lg font-semibold mb-6">This Week</h2>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className={`text-center p-3 rounded-lg ${
                    day.shifts > 0 ? "text-white" : "bg-gray-50 text-gray-400"
                  }`}
                  style={day.shifts > 0 ? { backgroundColor: "#00523E" } : {}}
                >
                  <div className="text-xs mb-1">{day.dayName}</div>
                  <div className="text-lg font-medium mb-1">{day.dateNum}</div>
                  <div className="text-xs">
                    {day.hours > 0 ? `${day.hours.toFixed(1)}h` : "—"}
                  </div>
                </div>
              ))}
            </div>
            <div
              className="mt-4 pt-4 border-t flex items-center justify-between text-sm"
              style={{ borderColor: "rgba(0,82,62,0.09)" }}
            >
              <span className="text-gray-600">Total this week</span>
              <span className="font-medium">{totalWeekHrs.toFixed(1)} hours</span>
            </div>
          </div>

          {/* Past Shifts */}
          {past.length > 0 && (
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
                <h2 className="text-lg font-semibold text-gray-500">
                  Past Shifts
                </h2>
              </div>
              <div
                className="divide-y"
                style={{ borderColor: "rgba(0,82,62,0.07)" }}
              >
                {past.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="p-6 hover:bg-white/40 transition-colors cursor-pointer"
                    onClick={() => setSelected(a)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-700">
                          {a.shift.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {fmtDate(a.shift.startTime)} ·{" "}
                          {fmt(a.shift.startTime)} – {fmt(a.shift.endTime)}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        {a.status.toLowerCase()}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(a);
                        }}
                        className="hover:underline"
                        style={{ color: "#00523E" }}
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Availability */}
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
            <h2 className="text-lg font-semibold mb-4">My Availability</h2>
            <div className="space-y-3">
              <Link
                to="/worker/update-availability"
                className="block w-full text-center text-white px-4 py-3 rounded-xl text-sm font-medium hover:opacity-90"
                style={{ backgroundColor: "#00523E" }}
              >
                Update Availability
              </Link>
              <Link
                to="/worker/shift-swap"
                className="block w-full text-center px-4 py-3 rounded-xl text-sm font-medium"
                style={{
                  border: "1px solid rgba(0,82,62,0.18)",
                  color: "#00523E",
                }}
              >
                Request Shift Swap
              </Link>
            </div>
            {availability.length > 0 && (
              <div
                className="mt-4 pt-4 border-t"
                style={{ borderColor: "rgba(0,82,62,0.09)" }}
              >
                <p className="text-sm text-gray-600 mb-2">
                  Current availability:
                </p>
                <div className="space-y-1">
                  {availability.map((av) => (
                    <div
                      key={av.id}
                      className="flex justify-between text-xs text-gray-500"
                    >
                      <span>{DAY_NAMES[av.dayOfWeek]}</span>
                      <span>
                        {av.startTime} – {av.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mini Calendar — current month */}
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
            <h2 className="text-lg font-medium mb-4">
              {now.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div className="text-sm text-gray-600">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div
                    key={i}
                    className="text-center text-xs font-medium text-gray-400"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {/* Offset for first day of month */}
                {Array.from(
                  {
                    length: new Date(
                      now.getFullYear(),
                      now.getMonth(),
                      1,
                    ).getDay(),
                  },
                  (_, i) => (
                    <div key={`e-${i}`} />
                  ),
                )}
                {Array.from(
                  {
                    length: new Date(
                      now.getFullYear(),
                      now.getMonth() + 1,
                      0,
                    ).getDate(),
                  },
                  (_, i) => {
                    const day = i + 1;
                    const hasShift = upcoming.some((a) => {
                      const d = new Date(a.shift.startTime);
                      return (
                        d.getDate() === day && d.getMonth() === now.getMonth()
                      );
                    });
                    const isToday = day === now.getDate();
                    return (
                      <div
                        key={day}
                        className={`text-center p-1.5 text-xs rounded ${
                          hasShift
                            ? "text-white font-medium"
                            : isToday
                              ? "border font-medium"
                              : "text-gray-600"
                        }`}
                        style={
                          hasShift
                            ? { backgroundColor: "#00523E" }
                            : isToday
                              ? { borderColor: "#00523E", color: "#00523E" }
                              : {}
                        }
                      >
                        {day}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <ShiftDetailsModal
          assignment={selected}
          onClose={() => setSelected(null)}
          onCheckedIn={applyAttendanceRecord}
          onCheckedOut={applyAttendanceRecord}
        />
      )}
    </div>
  );
}
