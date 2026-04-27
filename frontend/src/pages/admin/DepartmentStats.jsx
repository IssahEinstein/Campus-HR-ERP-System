import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  UserCheck,
  GraduationCap,
  Download,
  RefreshCw,
} from "lucide-react";
import * as adminApi from "../../api/admin";

const CARD_STYLE = {
  background:
    "linear-gradient(160deg, rgba(255,255,255,0.78) 0%, rgba(242,250,245,0.88) 100%)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(0,82,62,0.11)",
  boxShadow:
    "0 8px 40px rgba(0,82,62,0.09), inset 0 1px 0 rgba(255,255,255,0.95)",
};

function MetaBadge({ icon, value, label }) {
  return (
    <div className="flex flex-col items-center text-center min-w-[60px]">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-1"
        style={{ background: "rgba(0,82,62,0.10)", color: "#00523E" }}
      >
        {icon}
      </div>
      <p className="text-xl font-semibold leading-tight" style={{ color: "#00523E" }}>
        {value}
      </p>
      <p className="text-xs text-gray-500 leading-tight">{label}</p>
    </div>
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DepartmentStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getAllDepartmentStats();
      setStats(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.detail ?? "Failed to load department stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await adminApi.exportDepartmentsCSV();
      downloadBlob(blob, `department-stats-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch {
      // silently fail — user can retry
    } finally {
      setExporting(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    );

  if (error)
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

  const totalWorkers = stats.reduce((s, d) => s + d.worker_count, 0);
  const totalActive = stats.reduce((s, d) => s + d.active_worker_count, 0);
  const totalStudents = stats.reduce((s, d) => s + d.student_count, 0);
  const totalSupervisors = stats.reduce((s, d) => s + d.supervisor_count, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light mb-2">
            <span className="font-medium" style={{ color: "#00523E" }}>
              Department
            </span>{" "}
            Statistics
          </h1>
          <p className="text-gray-600">
            Workforce breakdown by department — supervisors, workers, and students.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
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
          <button
            onClick={handleExport}
            disabled={exporting || stats.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "#00523E" }}
          >
            <Download size={15} />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Building2 size={20} />, label: "Departments", value: stats.length },
          { icon: <Users size={20} />, label: "Supervisors", value: totalSupervisors },
          {
            icon: <Users size={20} />,
            label: "Workers",
            value: totalWorkers,
            sub: `${totalActive} active`,
          },
          { icon: <GraduationCap size={20} />, label: "Students", value: totalStudents },
        ].map(({ icon, label, value, sub }) => (
          <div key={label} className="rounded-2xl p-5" style={CARD_STYLE}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,82,62,0.10)", color: "#00523E" }}
              >
                {icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  {label}
                </p>
                <p
                  className="text-3xl font-semibold leading-tight"
                  style={{ color: "#00523E" }}
                >
                  {value}
                </p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Department Cards Grid */}
      {stats.length === 0 ? (
        <div className="rounded-2xl p-10 text-center text-gray-400" style={CARD_STYLE}>
          No departments found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stats.map((dept) => {
            const activeRate =
              dept.worker_count > 0
                ? Math.round((dept.active_worker_count / dept.worker_count) * 100)
                : 0;
            return (
              <div key={dept.id} className="rounded-2xl p-6" style={CARD_STYLE}>
                {/* Dept name */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(0,82,62,0.10)", color: "#00523E" }}
                  >
                    <Building2 size={18} />
                  </div>
                  <h3 className="font-semibold text-gray-800 leading-tight">
                    {dept.name}
                  </h3>
                </div>

                {/* Metrics row */}
                <div className="flex justify-around mb-4">
                  <MetaBadge
                    icon={<UserCheck size={14} />}
                    value={dept.supervisor_count}
                    label="Supervisors"
                  />
                  <MetaBadge
                    icon={<Users size={14} />}
                    value={dept.worker_count}
                    label="Workers"
                  />
                  <MetaBadge
                    icon={<GraduationCap size={14} />}
                    value={dept.student_count}
                    label="Students"
                  />
                </div>

                {/* Active workers bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Active workers</span>
                    <span>
                      {dept.active_worker_count}/{dept.worker_count} ({activeRate}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${activeRate}%`,
                        background:
                          activeRate >= 70
                            ? "linear-gradient(90deg, #00523E, #0d8c68)"
                            : activeRate >= 40
                            ? "linear-gradient(90deg, #ffb900, #f5a623)"
                            : "linear-gradient(90deg, #d83b01, #e85c2b)",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
