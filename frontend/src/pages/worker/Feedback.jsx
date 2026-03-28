import { useEffect, useMemo, useState } from "react";
import * as feedbackApi from "../../api/feedback";

function formatDate(isoDate) {
  if (!isoDate) return "";
  return new Date(isoDate).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StarRating({ value }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`Rating: ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`text-sm ${n <= value ? "text-yellow-500" : "text-gray-300"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function WorkerFeedback() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    feedbackApi
      .myFeedback()
      .then((data) => setFeedbackList(data))
      .catch((requestError) => {
        setError(
          requestError.response?.data?.detail ?? "Failed to load feedback.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = useMemo(() => feedbackList.length, [feedbackList]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">
          Supervisor{" "}
          <span className="font-medium" style={{ color: "#00523E" }}>
            Feedback
          </span>
        </h1>
        <p className="text-gray-600">
          {unreadCount} feedback item{unreadCount !== 1 ? "s" : ""} from your
          supervisors.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {feedbackList.length === 0 ? (
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
          No feedback yet. Feedback from your supervisor will appear here.
        </div>
      ) : (
        <div id="feedback-list" className="space-y-4 scroll-mt-24">
          {feedbackList.map((item) => {
            const supervisorName = item.supervisor?.user
              ? `${item.supervisor.user.firstName ?? ""} ${item.supervisor.user.lastName ?? ""}`.trim()
              : "Supervisor";

            return (
              <div
                key={item.id}
                className="rounded-2xl p-6"
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
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {item.category ?? "General"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      From {supervisorName || "Supervisor"}
                    </p>
                  </div>
                  <div className="text-right">
                    <StarRating value={item.rating} />
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {item.comments ?? "No comments provided."}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
