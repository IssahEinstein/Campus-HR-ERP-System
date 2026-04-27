import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as timeoffApi from "../../api/timeoff";

const REASONS = [
  "Vacation",
  "Sick Leave",
  "Personal",
  "Family Emergency",
  "Other",
];

export default function RequestTimeOff() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    reason: "Vacation",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date) {
      setError("Please fill in both dates.");
      return;
    }
    if (form.end_date < form.start_date) {
      setError("End date must be after start date.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await timeoffApi.submitTimeOff({
        start_date: form.start_date,
        end_date: form.end_date,
        reason: `${form.reason}${form.notes ? ` — ${form.notes}` : ""}`,
      });
      navigate("/worker/requests");
    } catch (err) {
      setError(err.response?.data?.detail ?? "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

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
            Request Time Off
          </span>
        </h1>
        <p className="text-gray-600">
          Submit a new time-off request for supervisor review.
        </p>
      </div>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#00523E" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#00523E" }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason
          </label>
          <select
            name="reason"
            value={form.reason}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
          >
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes (optional)
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={4}
            placeholder="Any additional context for your supervisor…"
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
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
