import { useCallback, useEffect, useMemo, useState } from "react";
import * as adminApi from "../../api/admin";

function personName(item) {
  const user = item?.user;
  if (user) return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Unknown";
  return "Unknown";
}

export default function AdminDashboard() {
  const [admins, setAdmins] = useState([]);
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
  const [adminInvite, setAdminInvite] = useState({
    email: "",
    first_name: "",
    last_name: "",
    admin_id: "",
  });
  const [savingDept, setSavingDept] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [sendingAdminInvite, setSendingAdminInvite] = useState(false);
  const [resendingSupervisorId, setResendingSupervisorId] = useState("");
  const [resendingAdminId, setResendingAdminId] = useState("");
  const [deletingSupervisorId, setDeletingSupervisorId] = useState("");
  const [adminQuery, setAdminQuery] = useState("");
  const [adminStatusFilter, setAdminStatusFilter] = useState("all");
  const [adminSort, setAdminSort] = useState("newest");
  const [toasts, setToasts] = useState([]);

  const pushToast = (text, type = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, s, w, d] = await Promise.all([
        adminApi.listAdmins(),
        adminApi.listSupervisors(),
        adminApi.listAllWorkers(),
        adminApi.listDepartments(),
      ]);
      setAdmins(a);
      setSupervisors(s);
      setWorkers(w);
      setDepartments(d);
    } catch (e) {
      pushToast(e.response?.data?.detail ?? "Failed to load admin data.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createDepartment = async (e) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    setSavingDept(true);
    try {
      await adminApi.createDepartment(deptName.trim());
      setDeptName("");
      pushToast("Department created.");
      await load();
    } catch (e2) {
      pushToast(e2.response?.data?.detail ?? "Failed to create department.", "error");
    } finally {
      setSavingDept(false);
    }
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    setSendingInvite(true);
    try {
      const res = await adminApi.inviteSupervisor(invite);
      setInvite({ email: "", first_name: "", last_name: "", supervisor_id: "", department_id: "" });
      const resultMessage = res?.message ?? "Supervisor invitation processed.";
      if (resultMessage.toLowerCase().includes("could not") || resultMessage.toLowerCase().includes("failed") || resultMessage.toLowerCase().includes("rejected")) {
        pushToast(resultMessage, "error");
      } else {
        pushToast(resultMessage);
      }
      await load();
    } catch (e2) {
      pushToast(e2.response?.data?.detail ?? "Failed to send invite.", "error");
    } finally {
      setSendingInvite(false);
    }
  };

  const resendInvite = async (supervisor) => {
    setResendingSupervisorId(supervisor.id);
    try {
      const res = await adminApi.resendSupervisorInvite(supervisor.id);
      const resultMessage = res?.message ?? "Invite resend processed.";
      if (resultMessage.toLowerCase().includes("could not") || resultMessage.toLowerCase().includes("failed") || resultMessage.toLowerCase().includes("rejected")) {
        pushToast(resultMessage, "error");
      } else {
        pushToast(resultMessage);
      }
    } catch (e2) {
      pushToast(e2.response?.data?.detail ?? "Failed to resend invite.", "error");
    } finally {
      setResendingSupervisorId("");
    }
  };

  const sendAdminInvite = async (e) => {
    e.preventDefault();
    setSendingAdminInvite(true);
    try {
      const res = await adminApi.inviteAdmin(adminInvite);
      setAdminInvite({ email: "", first_name: "", last_name: "", admin_id: "" });
      const resultMessage = res?.message ?? "Admin invitation processed.";
      if (resultMessage.toLowerCase().includes("could not") || resultMessage.toLowerCase().includes("failed") || resultMessage.toLowerCase().includes("rejected")) {
        pushToast(resultMessage, "error");
      } else {
        pushToast(resultMessage);
      }
      await load();
    } catch (e2) {
      pushToast(e2.response?.data?.detail ?? "Failed to send admin invite.", "error");
    } finally {
      setSendingAdminInvite(false);
    }
  };

  const resendAdminInvite = async (admin) => {
    setResendingAdminId(admin.id);
    try {
      const res = await adminApi.resendAdminInvite(admin.id);
      const resultMessage = res?.message ?? "Admin invite resend processed.";
      if (resultMessage.toLowerCase().includes("could not") || resultMessage.toLowerCase().includes("failed") || resultMessage.toLowerCase().includes("rejected")) {
        pushToast(resultMessage, "error");
      } else {
        pushToast(resultMessage);
      }
    } catch (e2) {
      pushToast(e2.response?.data?.detail ?? "Failed to resend admin invite.", "error");
    } finally {
      setResendingAdminId("");
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

    setDeletingSupervisorId(supervisor.id);
    try {
      const res = await adminApi.deleteSupervisor(supervisor.id);
      pushToast(res?.message ?? "Supervisor deleted.");
      await load();
    } catch (e2) {
      pushToast(e2.response?.data?.detail ?? "Failed to delete supervisor.", "error");
    } finally {
      setDeletingSupervisorId("");
    }
  };

  const filteredAdmins = useMemo(() => {
    const query = adminQuery.trim().toLowerCase();
    let rows = admins.filter((a) => {
      const pending = Boolean(a?.invitePending);
      if (adminStatusFilter === "pending" && !pending) return false;
      if (adminStatusFilter === "active" && pending) return false;

      if (!query) return true;
      const name = personName(a).toLowerCase();
      const email = String(a?.user?.email ?? "").toLowerCase();
      const adminId = String(a?.adminId ?? "").toLowerCase();
      return name.includes(query) || email.includes(query) || adminId.includes(query);
    });

    rows = [...rows].sort((left, right) => {
      if (adminSort === "name-asc") return personName(left).localeCompare(personName(right));
      if (adminSort === "name-desc") return personName(right).localeCompare(personName(left));

      const leftTs = new Date(left?.createdAt ?? 0).getTime();
      const rightTs = new Date(right?.createdAt ?? 0).getTime();
      if (adminSort === "oldest") return leftTs - rightTs;
      return rightTs - leftTs;
    });

    return rows;
  }, [admins, adminQuery, adminStatusFilter, adminSort]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-light mb-2">
          <span className="font-medium" style={{ color: "#00523E" }}>Admin Dashboard</span>
        </h1>
        <p className="text-gray-600">System-wide people and department management.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm text-gray-500">Admins</div>
          <div className="text-3xl font-bold text-gray-800">{admins.length}</div>
        </div>
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

      <div className="fixed right-4 top-4 z-50 space-y-2 w-[min(90vw,380px)]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg px-4 py-3 text-sm border shadow ${toast.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}
          >
            {toast.text}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={sendAdminInvite} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-medium">Invite Admin</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={adminInvite.first_name}
              onChange={(e) => setAdminInvite((v) => ({ ...v, first_name: e.target.value }))}
              placeholder="First name"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              value={adminInvite.last_name}
              onChange={(e) => setAdminInvite((v) => ({ ...v, last_name: e.target.value }))}
              placeholder="Last name"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          <input
            type="email"
            value={adminInvite.email}
            onChange={(e) => setAdminInvite((v) => ({ ...v, email: e.target.value }))}
            placeholder="Email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            value={adminInvite.admin_id}
            onChange={(e) => setAdminInvite((v) => ({ ...v, admin_id: e.target.value }))}
            placeholder="Admin ID"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
          />
          <button
            disabled={sendingAdminInvite}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "#00523E" }}
          >
            {sendingAdminInvite ? "Sending..." : "Send Admin Invite"}
          </button>
        </form>

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

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden xl:col-span-1">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-medium">Admins</h3>
          </div>
          <div className="px-5 py-3 border-b border-gray-100 space-y-2">
            <input
              value={adminQuery}
              onChange={(e) => setAdminQuery(e.target.value)}
              placeholder="Search name, email, or admin ID"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={adminStatusFilter}
                onChange={(e) => setAdminStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-xs"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Activated</option>
              </select>
              <select
                value={adminSort}
                onChange={(e) => setAdminSort(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-xs"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-[380px] overflow-auto">
            {filteredAdmins.map((a) => {
              const isPending = Boolean(a?.invitePending);
              return (
                <div key={a.id} className="px-5 py-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-800">{personName(a)}</div>
                      <div className="text-gray-500 text-xs">{a.user?.email ?? "No email"}</div>
                      <div className="text-gray-400 text-xs mt-1">Admin ID: {a.adminId ?? "N/A"}</div>
                      <div className="text-xs mt-1">
                        {isPending ? (
                          <span className="text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">Invite pending</span>
                        ) : (
                          <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Activated</span>
                        )}
                      </div>
                    </div>
                    {isPending && (
                      <button
                        onClick={() => resendAdminInvite(a)}
                        disabled={resendingAdminId === a.id}
                        className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                      >
                        {resendingAdminId === a.id ? "Resending..." : "Resend Invite"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredAdmins.length === 0 && <div className="px-5 py-8 text-sm text-gray-400">No admins match your filters.</div>}
          </div>
        </div>

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
