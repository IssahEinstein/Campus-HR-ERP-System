import { useEffect, useState } from "react";
import * as adminApi from "../../api/admin";

function personName(item) {
  const user = item?.user;
  if (user) return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Unknown";
  return "Unknown";
}

export default function AdminDashboard() {
  const [supervisors, setSupervisors] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptName, setDeptName] = useState("");
  const [invite, setInvite] = useState({
    email: "",
    first_name: "",
    last_name: "",
    supervisor_id: "",
    department_id: "",
  });
  const [savingDept, setSavingDept] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [resendingSupervisorId, setResendingSupervisorId] = useState("");
  const [deletingSupervisorId, setDeletingSupervisorId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [s, w, d] = await Promise.all([
        adminApi.listSupervisors(),
        adminApi.listAllWorkers(),
        adminApi.listDepartments(),
      ]);
      setSupervisors(s);
      setWorkers(w);
      setDepartments(d);
    } catch (e) {
      setError(e.response?.data?.detail ?? "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createDepartment = async (e) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    setError("");
    setMessage("");
    setSavingDept(true);
    try {
      await adminApi.createDepartment(deptName.trim());
      setDeptName("");
      setMessage("Department created.");
      await load();
    } catch (e2) {
      setError(e2.response?.data?.detail ?? "Failed to create department.");
    } finally {
      setSavingDept(false);
    }
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSendingInvite(true);
    try {
      const res = await adminApi.inviteSupervisor(invite);
      setInvite({ email: "", first_name: "", last_name: "", supervisor_id: "", department_id: "" });
      const resultMessage = res?.message ?? "Supervisor invitation processed.";
      if (resultMessage.toLowerCase().includes("could not") || resultMessage.toLowerCase().includes("failed") || resultMessage.toLowerCase().includes("rejected")) {
        setError(resultMessage);
      } else {
        setMessage(resultMessage);
      }
      await load();
    } catch (e2) {
      setError(e2.response?.data?.detail ?? "Failed to send invite.");
    } finally {
      setSendingInvite(false);
    }
  };

  const resendInvite = async (supervisor) => {
    setError("");
    setMessage("");
    setResendingSupervisorId(supervisor.id);
    try {
      const res = await adminApi.resendSupervisorInvite(supervisor.id);
      const resultMessage = res?.message ?? "Invite resend processed.";
      if (resultMessage.toLowerCase().includes("could not") || resultMessage.toLowerCase().includes("failed") || resultMessage.toLowerCase().includes("rejected")) {
        setError(resultMessage);
      } else {
        setMessage(resultMessage);
      }
    } catch (e2) {
      setError(e2.response?.data?.detail ?? "Failed to resend invite.");
    } finally {
      setResendingSupervisorId("");
    }
  };

  const isInvitePending = (supervisor) => {
    return Boolean(supervisor?.invitePending);
  };

  const removeSupervisor = async (supervisor) => {
    const fullName = personName(supervisor);
    const confirmed = window.confirm(
      `Delete supervisor ${fullName}? This will remove their account and related supervisor-owned records.`
    );
    if (!confirmed) return;

    setError("");
    setMessage("");
    setDeletingSupervisorId(supervisor.id);
    try {
      const res = await adminApi.deleteSupervisor(supervisor.id);
      setMessage(res?.message ?? "Supervisor deleted.");
      await load();
    } catch (e2) {
      setError(e2.response?.data?.detail ?? "Failed to delete supervisor.");
    } finally {
      setDeletingSupervisorId("");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-light mb-2">
          <span className="font-medium" style={{ color: "#00523E" }}>Admin Dashboard</span>
        </h1>
        <p className="text-gray-600">System-wide people and department management.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm text-gray-500">Workers</div>
          <div className="text-3xl font-bold text-gray-800">{workers.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm text-gray-500">Supervisors</div>
          <div className="text-3xl font-bold text-gray-800">{supervisors.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm text-gray-500">Departments</div>
          <div className="text-3xl font-bold" style={{ color: "#00523E" }}>{departments.length}</div>
        </div>
      </div>

      {(message || error) && (
        <div className={`rounded-lg px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
          {error || message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={createDepartment} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-medium">Create Department</h2>
          <input
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            placeholder="Department name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
          />
          <button
            disabled={savingDept}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "#00523E" }}
          >
            {savingDept ? "Creating..." : "Create"}
          </button>
        </form>

        <form onSubmit={sendInvite} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-medium">Invite Supervisor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={invite.first_name}
              onChange={(e) => setInvite((v) => ({ ...v, first_name: e.target.value }))}
              placeholder="First name"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              value={invite.last_name}
              onChange={(e) => setInvite((v) => ({ ...v, last_name: e.target.value }))}
              placeholder="Last name"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          <input
            type="email"
            value={invite.email}
            onChange={(e) => setInvite((v) => ({ ...v, email: e.target.value }))}
            placeholder="Email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={invite.supervisor_id}
              onChange={(e) => setInvite((v) => ({ ...v, supervisor_id: e.target.value }))}
              placeholder="Supervisor ID"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
            <select
              value={invite.department_id}
              onChange={(e) => setInvite((v) => ({ ...v, department_id: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <button
            disabled={sendingInvite}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "#00523E" }}
          >
            {sendingInvite ? "Sending..." : "Send Invite"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden xl:col-span-1">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-medium">Departments</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-[380px] overflow-auto">
            {departments.map((d) => (
              <div key={d.id} className="px-5 py-3 text-sm flex items-center justify-between">
                <span className="text-gray-700">{d.name}</span>
                <span className="text-xs text-gray-400">{d.id.slice(0, 8)}...</span>
              </div>
            ))}
            {departments.length === 0 && <div className="px-5 py-8 text-sm text-gray-400">No departments.</div>}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden xl:col-span-1">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-medium">Supervisors</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-[380px] overflow-auto">
            {supervisors.map((s) => (
              <div key={s.id} className="px-5 py-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-gray-800">{personName(s)}</div>
                    <div className="text-gray-500 text-xs">{s.user?.email ?? "No email"}</div>
                    <div className="text-gray-400 text-xs mt-1">{s.department?.name ?? "No department"}</div>
                    <div className="text-xs mt-1">
                      {isInvitePending(s) ? (
                        <span className="text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">Invite pending</span>
                      ) : (
                        <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Activated</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isInvitePending(s) && (
                      <button
                        onClick={() => resendInvite(s)}
                        disabled={resendingSupervisorId === s.id}
                        className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                      >
                        {resendingSupervisorId === s.id ? "Resending..." : "Resend Invite"}
                      </button>
                    )}
                    <button
                      onClick={() => removeSupervisor(s)}
                      disabled={deletingSupervisorId === s.id}
                      className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      {deletingSupervisorId === s.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {supervisors.length === 0 && <div className="px-5 py-8 text-sm text-gray-400">No supervisors.</div>}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden xl:col-span-1">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-medium">Workers</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-[380px] overflow-auto">
            {workers.map((w) => (
              <div key={w.id} className="px-5 py-3 text-sm">
                <div className="font-medium text-gray-800">{personName(w)}</div>
                <div className="text-gray-500 text-xs">{w.user?.email ?? "No email"}</div>
                <div className="text-gray-400 text-xs mt-1">
                  {w.department?.name ?? "No department"} · {w.status ?? "UNKNOWN"}
                </div>
              </div>
            ))}
            {workers.length === 0 && <div className="px-5 py-8 text-sm text-gray-400">No workers.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
