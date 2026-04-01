import { useEffect, useState } from "react";
import { Plus, Calendar } from "lucide-react";
import * as shiftsApi from "../../api/shifts";
import * as supervisorsApi from "../../api/supervisors";
import CreateShiftModal from "../../components/modals/CreateShiftModal";

export default function SupervisorSchedule() {
  const [shifts, setShifts] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = () =>
    Promise.all([shiftsApi.listShifts(), supervisorsApi.myWorkers()])
      .then(([s, w]) => {
        setShifts(s);
        setWorkers(w);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const now = new Date();
  const upcoming = shifts
    .filter((s) => new Date(s.endTime) >= now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const past = shifts
    .filter((s) => new Date(s.endTime) < now)
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

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

  const isActive = (s) => {
    const start = new Date(s.startTime);
    const end = new Date(s.endTime);
    return start <= now && end >= now;
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-light mb-2">
            <span className="font-medium" style={{ color: "#00523E" }}>
              Schedule
            </span>{" "}
            Management
          </h1>
          <p className="text-gray-600">
            Create and manage shifts for your team.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90"
          style={{ backgroundColor: "#00523E" }}
        >
          <Plus size={16} /> Create Shift
        </button>
      </div>

      <div className="space-y-6">
        {/* Upcoming */}
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
            <h2 className="text-lg font-semibold">Upcoming &amp; Active</h2>
          </div>
          {upcoming.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
              <p>
                No upcoming shifts. Click <strong>Create Shift</strong> to get
                started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead
                  className="border-b"
                  style={{
                    backgroundColor: "rgba(0,82,62,0.04)",
                    borderColor: "rgba(0,82,62,0.09)",
                  }}
                >
                  <tr>
                    <th className="p-4 text-left font-medium text-gray-500">
                      Shift
                    </th>
                    <th className="p-4 text-left font-medium text-gray-500">
                      Date & Time
                    </th>
                    <th className="p-4 text-left font-medium text-gray-500">
                      Location
                    </th>
                    <th className="p-4 text-left font-medium text-gray-500">
                      Worker
                    </th>
                    <th className="p-4 text-center font-medium text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y"
                  style={{ borderColor: "rgba(0,82,62,0.07)" }}
                >
                  {upcoming.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-white/40 transition-colors"
                    >
                      <td className="p-4 font-medium text-gray-800">
                        {s.title}
                      </td>
                      <td className="p-4 text-gray-600">
                        {fmt(s.startTime)} · {fmtT(s.startTime)} –{" "}
                        {fmtT(s.endTime)}
                      </td>
                      <td className="p-4 text-gray-500">{s.location ?? "—"}</td>
                      <td className="p-4 text-gray-600">{s.assignedWorkerName ?? "—"}</td>
                      <td className="p-4 text-center">
                        {isActive(s) ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            Upcoming
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Past */}
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead
                  className="border-b"
                  style={{
                    backgroundColor: "rgba(0,82,62,0.04)",
                    borderColor: "rgba(0,82,62,0.09)",
                  }}
                >
                  <tr>
                    <th className="p-4 text-left font-medium text-gray-500">
                      Shift
                    </th>
                    <th className="p-4 text-left font-medium text-gray-500">
                      Date & Time
                    </th>
                    <th className="p-4 text-left font-medium text-gray-500">
                      Location
                    </th>
                    <th className="p-4 text-left font-medium text-gray-500">
                      Worker
                    </th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y"
                  style={{ borderColor: "rgba(0,82,62,0.07)" }}
                >
                  {past.slice(0, 10).map((s) => (
                    <tr key={s.id} className="text-gray-400">
                      <td className="p-4">{s.title}</td>
                      <td className="p-4">
                        {fmt(s.startTime)} · {fmtT(s.startTime)} –{" "}
                        {fmtT(s.endTime)}
                      </td>
                      <td className="p-4">{s.location ?? "—"}</td>
                      <td className="p-4">{s.assignedWorkerName ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateShiftModal
          workers={workers}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}
