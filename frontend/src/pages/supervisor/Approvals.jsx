import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Calendar,
  Repeat,
  ChevronRight,
} from "lucide-react";
import * as timeoffApi from "../../api/timeoff";
import * as shiftswapApi from "../../api/shiftswap";

export default function SupervisorApprovals() {
  const [timeoffs, setTimeoffs] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [denyNote, setDenyNote] = useState({});
  const [denyOpen, setDenyOpen] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const [to, sw] = await Promise.all([
        timeoffApi.pendingTimeOff(),
        shiftswapApi.pendingSwaps(),
      ]);
      setTimeoffs(to);
      setSwaps(sw);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (item) => {
    setActing({ id: item.id, action: "approve" });
    try {
      if (item._type === "TIMEOFF")
        await timeoffApi.reviewTimeOff(item.id, "APPROVED", "");
      else await shiftswapApi.reviewSwap(item.id, "APPROVED", "");
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setActing(null);
    }
  };

  const deny = async (item) => {
    const notes = denyNote[item.id] ?? "";
    setActing({ id: item.id, action: "deny" });
    try {
      if (item._type === "TIMEOFF")
        await timeoffApi.reviewTimeOff(item.id, "REJECTED", notes);
      else await shiftswapApi.reviewSwap(item.id, "REJECTED", notes);
      setDenyOpen(null);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setActing(null);
    }
  };

  const fmt = (iso) =>
    new Date(iso).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const all = [
    ...timeoffs.map((r) => ({ ...r, _type: "TIMEOFF" })),
    ...swaps.map((r) => ({ ...r, _type: "SWAP" })),
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/supervisor/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
        >
          <ChevronRight size={16} className="rotate-180" />
          Back to Dashboard
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">
          <span className="font-medium" style={{ color: "#00523E" }}>
            Pending
          </span>{" "}
          Approvals
        </h1>
        <p className="text-gray-600">Review and approve worker requests.</p>
      </div>

      {all.length === 0 ? (
        <div
          className="rounded-2xl p-16 text-center"
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
          <CheckCircle size={64} className="mx-auto mb-4 text-gray-300" />
          <div className="text-xl font-medium text-gray-700 mb-1">
            All caught up!
          </div>
          <div className="text-gray-400 text-sm">
            No pending requests to review.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {all.map((item) => {
            const isActing = acting?.id === item.id;
            const showDeny = denyOpen === item.id;
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
                <div className="flex items-start gap-4">
                  {/* Type icon badge */}
                  <div
                    className={`p-3 rounded-lg flex-shrink-0 ${item._type === "TIMEOFF" ? "bg-blue-100" : "bg-purple-100"}`}
                  >
                    {item._type === "TIMEOFF" ? (
                      <Calendar size={24} className="text-blue-600" />
                    ) : (
                      <Repeat size={24} className="text-purple-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              item._type === "TIMEOFF"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-purple-50 text-purple-700"
                            }`}
                          >
                            {item._type === "TIMEOFF"
                              ? "Time Off"
                              : "Shift Swap"}
                          </span>
                          <span className="text-xs text-gray-400">
                            Received {fmt(item.createdAt)}
                          </span>
                        </div>
                        {item._type === "TIMEOFF" && (
                          <div className="font-medium text-gray-800">
                            {fmt(item.startDate)} – {fmt(item.endDate)}
                          </div>
                        )}
                        {item.reason && (
                          <div className="text-sm text-gray-600 mt-1">
                            {item.reason}
                          </div>
                        )}
                      </div>

                      {!showDeny && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => approve(item)}
                            disabled={isActing}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-60 hover:opacity-90"
                            style={{ backgroundColor: "#00523E" }}
                          >
                            <CheckCircle size={14} />
                            {isActing && acting.action === "approve"
                              ? "Approving…"
                              : "Approve"}
                          </button>
                          <button
                            onClick={() => setDenyOpen(item.id)}
                            disabled={isActing}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                          >
                            <XCircle size={14} />
                            Deny
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Deny with note */}
                    {showDeny && (
                      <div
                        className="mt-4 border-t pt-4 space-y-3"
                        style={{ borderColor: "rgba(0,82,62,0.09)" }}
                      >
                        <label className="block text-sm font-medium text-gray-700">
                          Reason for denial (optional)
                        </label>
                        <textarea
                          value={denyNote[item.id] ?? ""}
                          onChange={(e) =>
                            setDenyNote((n) => ({
                              ...n,
                              [item.id]: e.target.value,
                            }))
                          }
                          rows={2}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1"
                          placeholder="Enter a reason to share with the worker…"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setDenyOpen(null)}
                            className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => deny(item)}
                            disabled={isActing}
                            className="px-4 py-1.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            {isActing && acting.action === "deny"
                              ? "Denying…"
                              : "Confirm Deny"}
                          </button>
                        </div>
                      </div>
                    )}
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
