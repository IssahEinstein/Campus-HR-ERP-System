import { useState } from "react";
import { X, Star } from "lucide-react";
import * as feedbackApi from "../../api/feedback";

const CATEGORIES = [
  "Communication",
  "Punctuality",
  "Work Quality",
  "Teamwork",
  "Initiative",
];

export default function FeedbackModal({ worker, onClose }) {
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const displayName = worker?.user
    ? `${worker.user.firstName ?? ""} ${worker.user.lastName ?? ""}`.trim()
    : `${worker?.firstName ?? ""} ${worker?.lastName ?? ""}`.trim() || "Worker";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!worker?.id) {
      setError("Worker not found.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await feedbackApi.createWorkerFeedback(worker.id, {
        rating,
        category,
        comments,
      });
      setSaved(true);
      setTimeout(() => onClose?.(), 700);
    } catch (requestError) {
      setError(requestError.response?.data?.detail ?? "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Give Feedback</h2>
            <p className="text-sm text-gray-500 mt-1">for {displayName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-1"
                  aria-label={`Set rating ${n}`}
                >
                  <Star
                    size={22}
                    className={n <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00523E]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              required
              placeholder="Share specific, actionable feedback..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#00523E]"
            />
          </div>

          {saved && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Feedback submitted.
            </div>
          )}

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90"
              style={{ backgroundColor: "#00523E" }}
            >
              {submitting ? "Submitting..." : "Save Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
