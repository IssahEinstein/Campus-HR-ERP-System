import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import * as supervisorsApi from "../../api/supervisors";
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

export default function SupervisorTeam() {
  const [workers,  setWorkers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [feedback, setFeedback] = useState(null); // worker to give feedback to
  const [inviting, setInviting] = useState(false);
  const [resendingWorkerId, setResendingWorkerId] = useState("");
  const [deletingWorkerId, setDeletingWorkerId] = useState("");
  const [pendingDeleteWorker, setPendingDeleteWorker] = useState(null);
  const [formError, setFormError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [inviteForm, setInviteForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    worker_id: "",
    student_id: "",
    role: "WORKER",
  });

  const loadWorkers = () => {
    setLoading(true);
    supervisorsApi.myWorkers()
      .then((data) => setWorkers(data.map(normalizeWorker)))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const handleInviteInput = (event) => {
    const { name, value } = event.target;
    setInviteForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleInviteSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setFormMessage("");
    setInviting(true);
    try {
      const response = await supervisorsApi.inviteWorker(inviteForm);
      const message = response?.message ?? "Worker created and invite processed.";
      if (message.toLowerCase().includes("could not") || message.toLowerCase().includes("failed") || message.toLowerCase().includes("rejected")) {
        setFormError(message);
      } else {
        setFormMessage(message);
      }
      setInviteForm({
        first_name: "",
        last_name: "",
        email: "",
        worker_id: "",
        student_id: "",
        role: "WORKER",
      });
      loadWorkers();
    } catch (requestError) {
      setFormError(requestError.response?.data?.detail ?? "Failed to create worker.");
    } finally {
      setInviting(false);
    }
  };

  const resendInvite = async (worker) => {
    setFormError("");
    setFormMessage("");
    setResendingWorkerId(worker.id);
    try {
      const response = await supervisorsApi.resendWorkerInvite(worker.id);
      const message = response?.message ?? "Worker invite resend processed.";
      if (message.toLowerCase().includes("could not") || message.toLowerCase().includes("failed") || message.toLowerCase().includes("rejected")) {
        setFormError(message);
      } else {
        setFormMessage(message);
      }
    } catch (requestError) {
      setFormError(requestError.response?.data?.detail ?? "Failed to resend worker invite.");
    } finally {
      setResendingWorkerId("");
    }
  };

  const removeWorker = async (worker) => {
    setFormError("");
    setFormMessage("");
    setDeletingWorkerId(worker.id);
    try {
      const response = await supervisorsApi.deleteWorker(worker.id);
      setFormMessage(response?.message ?? "Worker deleted successfully.");
      setPendingDeleteWorker(null);
      loadWorkers();
    } catch (requestError) {
      setFormError(requestError.response?.data?.detail ?? "Failed to delete worker.");
    } finally {
      setDeletingWorkerId("");
    }
  };

  const isInvitePending = (worker) => String(worker?.status ?? "").toUpperCase() === "INVITED";

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light mb-2">
            <span className="font-medium" style={{ color: "#00523E" }}>My Team</span>
          </h1>
          <p className="text-gray-600">{workers.length} worker{workers.length !== 1 ? "s" : ""} on your team.</p>
        </div>
      </div>

      <form onSubmit={handleInviteSubmit} className="mb-8 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-medium">Create Worker</h2>
          <p className="text-sm text-gray-500">Create a worker account and send an activation invite.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            name="first_name"
            value={inviteForm.first_name}
            onChange={handleInviteInput}
            placeholder="First name"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            name="last_name"
            value={inviteForm.last_name}
            onChange={handleInviteInput}
            placeholder="Last name"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="email"
            name="email"
            value={inviteForm.email}
            onChange={handleInviteInput}
            placeholder="Email"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
          />
          <select
            name="role"
            value={inviteForm.role}
            onChange={handleInviteInput}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
          >
            <option value="WORKER">WORKER</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            name="worker_id"
            value={inviteForm.worker_id}
            onChange={handleInviteInput}
            placeholder="Worker ID"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            name="student_id"
            value={inviteForm.student_id}
            onChange={handleInviteInput}
            placeholder="Student ID"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>

        {formError && (
          <div className="rounded-lg px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-200">
            {formError}
          </div>
        )}

        {formMessage && (
          <div className="rounded-lg px-4 py-3 text-sm bg-green-50 text-green-700 border border-green-200">
            {formMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={inviting}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: "#00523E" }}
        >
          {inviting ? "Creating..." : "Create Worker"}
        </button>
      </form>

      {workers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No workers assigned to your team yet.
        </div>
      ) : (
        <div id="team-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 scroll-mt-24">
          {workers.map((w) => {
            const firstInitial = (w.firstName ?? "").trim().charAt(0);
            const lastInitial = (w.lastName ?? "").trim().charAt(0);
            const emailInitial = (w.email ?? "").trim().charAt(0);
            const initials = (`${firstInitial}${lastInitial}`.toUpperCase() || emailInitial.toUpperCase() || "NA");
            return (
              <div key={w.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: "#00523E" }}
                    >
                      {initials}
                    </div>
                    <div>
                      <div className="font-medium">{w.firstName} {w.lastName}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    isInvitePending(w) ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"
                  }`}>
                    {isInvitePending(w) ? "Invite pending" : "Active"}
                  </span>
                </div>
                {w.email && <div className="text-sm text-gray-500 mb-4 truncate">{w.email}</div>}
                {w.departmentName && <div className="text-xs text-gray-400 mb-4">{w.departmentName}</div>}
                <div className="flex gap-2">
                  <Link
                    to={`/supervisor/team/${w.id}`}
                    className="flex-1 text-center text-sm py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={() => setFeedback(w)}
                    className="flex items-center gap-1 text-sm py-1.5 px-3 rounded-lg text-white hover:opacity-90"
                    style={{ backgroundColor: "#00523E" }}
                    title="Give Feedback"
                  >
                    <MessageSquare size={14} />
                  </button>
                  {isInvitePending(w) && (
                    <button
                      onClick={() => resendInvite(w)}
                      disabled={resendingWorkerId === w.id}
                      className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                      title="Resend Invite"
                    >
                      {resendingWorkerId === w.id ? "Resending..." : "Resend"}
                    </button>
                  )}
                  <button
                    onClick={() => setPendingDeleteWorker(w)}
                    disabled={deletingWorkerId === w.id}
                    className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                    title="Delete Worker"
                  >
                    {deletingWorkerId === w.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {feedback && (
        <FeedbackModal worker={feedback} onClose={() => setFeedback(null)} />
      )}

      {pendingDeleteWorker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md p-6 space-y-4">
            <div>
              <h3 className="text-lg font-medium">Delete Worker</h3>
              <p className="text-sm text-gray-600 mt-1">
                Delete {pendingDeleteWorker.firstName} {pendingDeleteWorker.lastName}? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingDeleteWorker(null)}
                disabled={deletingWorkerId === pendingDeleteWorker.id}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => removeWorker(pendingDeleteWorker)}
                disabled={deletingWorkerId === pendingDeleteWorker.id}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
              >
                {deletingWorkerId === pendingDeleteWorker.id ? "Deleting..." : "Delete Worker"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
