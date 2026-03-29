import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as shiftsApi from "../../api/shifts";
import * as shiftswapApi from "../../api/shiftswap";

export default function ShiftSwap() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    from_assignment_id: "",
    target_worker_id: "",
    to_assignment_id: "",
    reason: "",
  });

  useEffect(() => {
    shiftsApi
      .myAssignments()
      .then((data) => {
        const upcoming = data.filter(
          (a) => a.shift && new Date(a.shift.startTime) >= new Date(),
        );
        setAssignments(upcoming);
        if (upcoming.length)
          setForm((f) => ({ ...f, from_assignment_id: upcoming[0].id }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.from_assignment_id) {
      setError("Please select a shift.");
      return;
    }
    if (!form.target_worker_id) {
      setError("Please enter the target worker ID.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await shiftswapApi.submitSwap({
        from_assignment_id: form.from_assignment_id,
        target_worker_id: form.target_worker_id,
        to_assignment_id: form.to_assignment_id || undefined,
        reason: form.reason || undefined,
      });
      navigate("/worker/requests");
    } catch (err) {
      setError(err.response?.data?.detail ?? "Failed to submit swap request.");
    } finally {
      setSubmitting(false);
    }
  };

  const fmtShift = (a) => {
    const s = a.shift;
    const d = new Date(s.startTime).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const t = new Date(s.startTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${s.title} — ${d} at ${t}`;
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate("/worker/requests")}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
        >
          ← Back to Requests
        </button>
        <h1 className="text-3xl font-light mb-2">
          <span className="font-medium" style={{ color: "#00523E" }}>
            Shift Swap Request
          </span>
        </h1>
        <p className="text-gray-600">
          Request to swap a shift with another worker.
        </p>
      </div>

      {assignments.length === 0 ? (
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
          You have no upcoming shifts to swap.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-6"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Shift to Swap
            </label>
            <select
              name="from_assignment_id"
              value={form.from_assignment_id}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {fmtShift(a)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Worker ID
            </label>
            <input
              type="text"
              name="target_worker_id"
              value={form.target_worker_id}
              onChange={handleChange}
              required
              placeholder="Enter the worker ID of your swap partner"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
            <p className="text-xs text-gray-400 mt-1">
              Ask your colleague for their Worker ID.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Their Assignment ID{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              name="to_assignment_id"
              value={form.to_assignment_id}
              onChange={handleChange}
              placeholder="Enter the assignment ID they want to swap"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              placeholder="Why are you requesting this swap?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate("/worker/requests")}
              className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 hover:opacity-90"
              style={{ backgroundColor: "#00523E" }}
            >
              {submitting ? "Submitting…" : "Submit Swap Request"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
