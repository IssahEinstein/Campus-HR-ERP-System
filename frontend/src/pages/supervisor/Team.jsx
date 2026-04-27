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
    gpa: w.gpa ?? null,
    enrollmentStatus: w.enrollmentStatus ?? w.enrollment_status ?? "",
    courseLoadCredits: w.courseLoadCredits ?? w.course_load_credits ?? null,
  };
}

export default function SupervisorTeam() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
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
    gpa: "",
    enrollment_status: "FULL_TIME",
    course_load_credits: "",
    role: "WORKER",
  });

  const loadWorkers = () => {
    setLoading(true);
    setFormError("");
    return supervisorsApi
      .myWorkers()
      .then((data) => {
        const normalized = data.map(normalizeWorker);
        setWorkers(normalized);
        return normalized;
      })
      .catch((error) => {
        console.error(error);
        setWorkers([]);
        setFormError(
          error.response?.data?.detail ?? "Failed to load team members.",
        );
        return [];
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const handleInviteInput = (event) => {
    const { name, value } = event.target;
    setInviteForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetInviteForm = () => {
    setInviteForm({
      first_name: "",
      last_name: "",
      email: "",
      worker_id: "",
      student_id: "",
      gpa: "",
      enrollment_status: "FULL_TIME",
      course_load_credits: "",
      role: "WORKER",
    });
    setShowInviteForm(false);
  };

  const handleInviteSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setFormMessage("");
    setInviting(true);
    try {
      const response = await supervisorsApi.inviteWorker({
        ...inviteForm,
        gpa: inviteForm.gpa === "" ? null : Number(inviteForm.gpa),
        course_load_credits:
          inviteForm.course_load_credits === ""
            ? null
            : Number(inviteForm.course_load_credits),
      });
      const message =
        response?.message ?? "Worker created and invite processed.";
      if (
        message.toLowerCase().includes("could not") ||
        message.toLowerCase().includes("failed") ||
        message.toLowerCase().includes("rejected")
      ) {
        setFormError(message);
      } else {
        setFormMessage(message);
      }
      resetInviteForm();
      loadWorkers();
    } catch (requestError) {
      const timedOut =
        requestError?.code === "ECONNABORTED" ||
        String(requestError?.message ?? "").toLowerCase().includes("timeout");

      if (timedOut) {
        const workersAfterTimeout = await loadWorkers();
        const submittedEmail = String(inviteForm.email ?? "")
          .trim()
          .toLowerCase();
        const created = Array.isArray(workersAfterTimeout)
          ? workersAfterTimeout.some(
              (w) => String(w?.email ?? "").trim().toLowerCase() === submittedEmail,
            )
          : false;

        if (created) {
          setFormMessage(
            "Invite request timed out, but the worker was created. Invite processing may still be running.",
          );
          resetInviteForm();
        } else {
          setFormError(
            "Invite request timed out. Worker creation was not confirmed; please retry once.",
          );
        }
      } else {
      setFormError(
        requestError.response?.data?.detail ?? "Failed to create worker.",
      );
      }
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
      if (
        message.toLowerCase().includes("could not") ||
        message.toLowerCase().includes("failed") ||
        message.toLowerCase().includes("rejected")
      ) {
        setFormError(message);
      } else {
        setFormMessage(message);
      }
    } catch (requestError) {
      setFormError(
        requestError.response?.data?.detail ??
          "Failed to resend worker invite.",
      );
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
      setFormError(
        requestError.response?.data?.detail ?? "Failed to delete worker.",
      );
    } finally {
      setDeletingWorkerId("");
    }
  };

  const isInvitePending = (worker) =>
    String(worker?.status ?? "").toUpperCase() === "INVITED";

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">
          <span className="font-medium" style={{ color: "#00523E" }}>
            Team
          </span>{" "}
          Management
        </h1>
        <p className="text-gray-600">
          View and manage your team members — {workers.length} worker
          {workers.length !== 1 ? "s" : ""} on your team.
        </p>
      </div>

      <div className="mb-8">
        {!showInviteForm ? (
          <button
            onClick={() => setShowInviteForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90"
            style={{ backgroundColor: "#00523E" }}
          >
            Add New Worker +
          </button>
        ) : (
          <form
            onSubmit={handleInviteSubmit}
            className="rounded-2xl p-6 space-y-4"
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
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-medium">Add New Worker</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Create a worker account and send an activation invite.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="number"
                name="gpa"
                value={inviteForm.gpa}
                onChange={handleInviteInput}
                placeholder="GPA (0-4)"
                min="0"
                max="4"
                step="0.01"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <select
                name="enrollment_status"
                value={inviteForm.enrollment_status}
                onChange={handleInviteInput}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="FULL_TIME">FULL_TIME</option>
                <option value="PART_TIME">PART_TIME</option>
                <option value="ON_LEAVE">ON_LEAVE</option>
                <option value="GRADUATED">GRADUATED</option>
              </select>
              <input
                type="number"
                name="course_load_credits"
                value={inviteForm.course_load_credits}
                onChange={handleInviteInput}
                placeholder="Course load credits"
                min="0"
                step="1"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
        )}
      </div>

      {workers.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center text-gray-400"
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
          No workers assigned to your team yet.
        </div>
      ) : (
        <div
          id="team-list"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 scroll-mt-24"
        >
          {workers.map((w) => {
            const firstInitial = (w.firstName ?? "").trim().charAt(0);
            const lastInitial = (w.lastName ?? "").trim().charAt(0);
            const emailInitial = (w.email ?? "").trim().charAt(0);
            const initials =
              `${firstInitial}${lastInitial}`.toUpperCase() ||
              emailInitial.toUpperCase() ||
              "NA";
            const isPending = isInvitePending(w);

            return (
              <div
                key={w.id}
                className="rounded-2xl p-6 hover:shadow-lg transition-shadow"
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
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-lg flex-shrink-0"
                      style={{ backgroundColor: "#00523E" }}
                    >
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {w.firstName} {w.lastName}
                      </h3>
                      <p className="text-sm text-gray-500 truncate max-w-[160px]">
                        {w.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      isPending
                        ? "bg-orange-100 text-orange-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {isPending ? "Invite Pending" : "Active"}
                  </span>
                </div>

                {/* Info rows */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Department</span>
                    <span className="font-medium text-gray-800">
                      {w.departmentName || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Worker ID</span>
                    <span className="font-medium text-gray-800">
                      {w.workerId || w.id?.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Enrollment</span>
                    <span className="font-medium text-gray-800">
                      {w.enrollmentStatus || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">GPA</span>
                    <span className="font-medium text-gray-800">
                      {w.gpa == null ? "-" : Number(w.gpa).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Link
                    to={`/supervisor/team/${w.id}`}
                    className="flex-1 text-center text-sm py-2 rounded-lg text-white font-medium hover:opacity-90"
                    style={{ backgroundColor: "#00523E" }}
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={() => setFeedback(w)}
                    className="flex items-center gap-1.5 text-sm py-2 px-3 rounded-lg font-medium"
                    style={{
                      border: "1px solid rgba(0,82,62,0.18)",
                      color: "#00523E",
                    }}
                  >
                    <MessageSquare size={14} />
                    Feedback
                  </button>
                  {isPending && (
                    <button
                      onClick={() => resendInvite(w)}
                      disabled={resendingWorkerId === w.id}
                      className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                    >
                      {resendingWorkerId === w.id ? "Resending…" : "Resend"}
                    </button>
                  )}
                  <button
                    onClick={() => setPendingDeleteWorker(w)}
                    disabled={deletingWorkerId === w.id}
                    className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    {deletingWorkerId === w.id ? "Deleting…" : "Remove"}
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
                Delete {pendingDeleteWorker.firstName}{" "}
                {pendingDeleteWorker.lastName}? This action cannot be undone.
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
                {deletingWorkerId === pendingDeleteWorker.id
                  ? "Deleting..."
                  : "Delete Worker"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
