import { useEffect, useState } from "react";
import { MapPin, ChevronRight } from "lucide-react";
import * as shiftsApi from "../../api/shifts";
import * as availabilityApi from "../../api/availability";
import ShiftDetailsModal from "../../components/modals/ShiftDetailsModal";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WorkerSchedule() {
  const [assignments,   setAssignments]   = useState([]);
  const [availability,  setAvailability]  = useState([]);
  const [selected,      setSelected]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [attendanceMap, setAttendanceMap] = useState({}); // assignmentId → record

  useEffect(() => {
    Promise.all([shiftsApi.myAssignments(), availabilityApi.myAvailability()])
      .then(([a, av]) => { setAssignments(a); setAvailability(av); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now   = new Date();
  const upcoming = assignments
    .filter((a) => a.shift && new Date(a.shift.endTime) >= now)
    .sort((a, b) => new Date(a.shift.startTime) - new Date(b.shift.startTime));
  const past   = assignments
    .filter((a) => a.shift && new Date(a.shift.endTime) < now)
    .sort((a, b) => new Date(b.shift.startTime) - new Date(a.shift.startTime));

  const fmt = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">
          <span className="font-medium" style={{ color: "#00523E" }}>Schedule</span>
        </h1>
        <p className="text-gray-600">Your upcoming shifts and availability.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shifts list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium">Upcoming Shifts</h2>
            </div>
            {upcoming.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No upcoming shifts.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {upcoming.map((a) => (
                  <div
                    key={a.id}
                    className="p-6 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelected(a)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin size={16} className="text-gray-400" />
                          <h3 className="font-medium">{a.shift.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          {fmtDate(a.shift.startTime)} · {fmt(a.shift.startTime)} – {fmt(a.shift.endTime)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        a.status === "ACCEPTED" ? "bg-green-50 text-green-700" :
                        a.status === "ASSIGNED" ? "bg-blue-50 text-blue-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{a.shift.location ?? ""}</span>
                      <button
                        className="hover:underline"
                        style={{ color: "#00523E" }}
                        onClick={(e) => { e.stopPropagation(); setSelected(a); }}
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past shifts */}
          {past.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-500">Past Shifts</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {past.slice(0, 5).map((a) => (
                  <div key={a.id} className="p-6">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="font-medium text-gray-700">{a.shift.title}</h3>
                        <p className="text-sm text-gray-500">
                          {fmtDate(a.shift.startTime)} · {fmt(a.shift.startTime)} – {fmt(a.shift.endTime)}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        {a.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Availability sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-4">My Availability</h2>
            {availability.length === 0 ? (
              <p className="text-sm text-gray-500">No availability set.</p>
            ) : (
              <div className="space-y-2">
                {availability.map((av) => (
                  <div key={av.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{DAY_NAMES[av.dayOfWeek]}</span>
                    <span className="font-medium">{av.startTime} – {av.endTime}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 space-y-2">
              <a
                href="/worker/update-availability"
                className="block w-full text-center text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                style={{ backgroundColor: "#00523E" }}
              >
                Update Availability
              </a>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <ShiftDetailsModal
          assignment={selected}
          onClose={() => setSelected(null)}
          onCheckedIn={(record) => setAttendanceMap((m) => ({ ...m, [selected.id]: record }))}
        />
      )}
    </div>
  );
}
