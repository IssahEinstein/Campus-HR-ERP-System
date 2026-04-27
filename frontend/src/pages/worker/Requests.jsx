import { useEffect, useState } from "react";
import {
  Calendar,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import * as timeoffApi from "../../api/timeoff";
import * as shiftswapApi from "../../api/shiftswap";

const TYPE_META = {
  TIMEOFF: {
    label: "Time Off",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    Icon: Calendar,
    borderColor: "border-green-200",
  },
  SWAP: {
    label: "Shift Swap",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    Icon: RefreshCw,
    borderColor: "border-blue-200",
  },
  AVAILABILITY: {
    label: "Availability",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    Icon: Clock,
    borderColor: "border-purple-200",
  },
};

const STATUS_META = {
  APPROVED: {
    label: "Approved",
    className: "bg-green-50 text-green-700",
    Icon: CheckCircle,
    notesBg: "bg-green-50 border-green-100",
    notesText: "text-green-800",
  },
  PENDING: {
    label: "Pending",
    className: "bg-yellow-50 text-yellow-700",
    Icon: Clock,
    notesBg: "bg-yellow-50 border-yellow-100",
    notesText: "text-yellow-800",
  },
  REJECTED: {
    label: "Denied",
    className: "bg-red-50 text-red-700",
    Icon: XCircle,
    notesBg: "bg-red-50 border-red-100",
    notesText: "text-red-800",
  },
  DENIED: {
    label: "Denied",
    className: "bg-red-50 text-red-700",
    Icon: XCircle,
    notesBg: "bg-red-50 border-red-100",
    notesText: "text-red-800",
  },
};

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

export default function WorkerRequests() {
  const [timeoffs, setTimeoffs] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      timeoffApi.myTimeOff().catch(() => []),
      shiftswapApi.mySwaps().catch(() => []),
    ]).then(([to, sw]) => {
      setTimeoffs(to.map((r) => ({ ...r, _type: "TIMEOFF" })));
      setSwaps(sw.map((r) => ({ ...r, _type: "SWAP" })));
      setLoading(false);
    });
  }, []);

  const combined = [...timeoffs, ...swaps].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  const filtered =
    filter === "ALL"
      ? combined
      : combined.filter((r) => {
          if (filter === "REJECTED") {
            return r.status === "REJECTED" || r.status === "DENIED";
          }
          return r.status === filter;
        });

  const handleCancel = async (req) => {
    if (!window.confirm("Cancel this request?")) return;
    try {
      if (req._type === "TIMEOFF") {
        await timeoffApi.cancelTimeOff(req.id);
        setTimeoffs((prev) => prev.filter((r) => r.id !== req.id));
      } else {
        await shiftswapApi.cancelSwap(req.id);
        setSwaps((prev) => prev.filter((r) => r.id !== req.id));
      }
    } catch {
      alert("Could not cancel. Please try again.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">
          <span className="font-medium" style={{ color: "#00523E" }}>
            My Requests
          </span>
        </h1>
        <p className="text-gray-600">
          Submit new requests or track the status of existing ones.
        </p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/worker/request-time-off"
          className="rounded-2xl border p-5 flex items-center gap-4 hover:shadow-md transition-all group"
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
          <div className="p-3 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors">
            <Calendar size={22} className="text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Request Time Off</p>
            <p className="text-sm text-gray-500">Submit a leave request</p>
          </div>
        </Link>

        <Link
          to="/worker/shift-swap"
          className="rounded-2xl border p-5 flex items-center gap-4 hover:shadow-md transition-all group"
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
          <div className="p-3 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
            <RefreshCw size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Swap Shift</p>
            <p className="text-sm text-gray-500">Request a shift swap</p>
          </div>
        </Link>

        <Link
          to="/worker/update-availability"
          className="rounded-2xl border p-5 flex items-center gap-4 hover:shadow-md transition-all group"
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
          <div className="p-3 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors">
            <Clock size={22} className="text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Update Availability</p>
            <p className="text-sm text-gray-500">Change your schedule</p>
          </div>
        </Link>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
            style={filter === f ? { backgroundColor: "#00523E" } : {}}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">
          Loading…
        </div>
      ) : filtered.length === 0 ? (
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
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium mb-1">No requests found</p>
          <p className="text-sm">
            {filter === "ALL"
              ? "Submit a request using the cards above."
              : `No ${filter.toLowerCase()} requests.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => {
            const typeMeta = TYPE_META[req._type] || TYPE_META.TIMEOFF;
            const statusMeta = STATUS_META[req.status] || STATUS_META.PENDING;
            const { Icon: TypeIcon } = typeMeta;
            const { Icon: StatusIcon } = statusMeta;

            return (
              <div
                key={`${req._type}-${req.id}`}
                className="rounded-2xl p-6 hover:shadow-md transition-shadow"
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
                  {/* Icon Badge */}
                  <div
                    className={`p-3 rounded-xl flex-shrink-0 ${typeMeta.iconBg}`}
                  >
                    <TypeIcon size={20} className={typeMeta.iconColor} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {typeMeta.label}
                          {req.reason ? ` — ${req.reason}` : ""}
                        </h3>
                        {(req.startDate ||
                          req.endDate ||
                          req.requestedDate) && (
                          <p className="text-sm text-gray-600 mt-0.5">
                            {req.startDate && req.endDate
                              ? `${fmtDate(req.startDate)} – ${fmtDate(req.endDate)}`
                              : req.requestedDate
                                ? fmtDate(req.requestedDate)
                                : ""}
                          </p>
                        )}
                      </div>
                      <span
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusMeta.className}`}
                      >
                        <StatusIcon size={12} />
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 mb-3">
                      <span>
                        Submitted:{" "}
                        <span className="text-gray-700">
                          {fmtDate(req.createdAt)}
                        </span>
                      </span>
                      {req.reviewedAt && (
                        <span>
                          Reviewed:{" "}
                          <span className="text-gray-700">
                            {fmtDate(req.reviewedAt)}
                          </span>
                        </span>
                      )}
                      {req.reviewedBy && (
                        <span>
                          By:{" "}
                          <span className="text-gray-700">
                            {req.reviewedBy}
                          </span>
                        </span>
                      )}
                      {req._type === "SWAP" && (
                        <span>
                          Requested Mode:{" "}
                          <span className="text-gray-700">
                            {req.preferredPermanent ? "Permanent recurring" : "One-time"}
                          </span>
                        </span>
                      )}
                    </div>

                    {req.notes && (
                      <div
                        className={`p-3 rounded-lg border text-xs mt-2 ${statusMeta.notesBg} ${statusMeta.notesText}`}
                      >
                        <span className="font-medium">Note: </span>
                        {req.notes}
                      </div>
                    )}

                    {req.status === "PENDING" && (
                      <div
                        className="mt-4 pt-3 border-t"
                        style={{ borderColor: "rgba(0,82,62,0.07)" }}
                      >
                        <button
                          onClick={() => handleCancel(req)}
                          className="text-sm text-red-500 hover:text-red-700 hover:underline"
                        >
                          Cancel Request
                        </button>
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
