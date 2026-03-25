import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, ArrowLeftRight, CalendarX } from "lucide-react";
import * as timeoffApi from "../../api/timeoff";
import * as shiftswapApi from "../../api/shiftswap";

const filters = ["ALL", "PENDING", "APPROVED", "DENIED"];

export default function WorkerRequests() {
  const [requests,  setRequests]  = useState([]);
  const [filter,    setFilter]    = useState("ALL");
  const [loading,   setLoading]   = useState(true);
  const [cancelling, setCancelling] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [timeOffs, swaps] = await Promise.all([
        timeoffApi.myTimeOff(),
        shiftswapApi.mySwaps(),
      ]);
      const combined = [
        ...timeOffs.map((r) => ({ ...r, _type: "TIMEOFF" })),
        ...swaps.map((r)    => ({ ...r, _type: "SWAP" })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRequests(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (req) => {
    setCancelling(req.id);
    try {
      if (req._type === "TIMEOFF") await timeoffApi.cancelTimeOff(req.id);
      else                          await shiftswapApi.cancelSwap(req.id);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setCancelling(null);
    }
  };

  const visible = requests.filter((r) =>
    filter === "ALL" ? true :
    filter === "APPROVED" ? (r.status === "APPROVED" || r.status === "ACCEPTED") :
    filter === "DENIED"   ? (r.status === "DENIED"   || r.status === "REJECTED") :
    r.status === filter
  );

  const fmt = (iso) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">
          <span className="font-medium" style={{ color: "#00523E" }}>My Requests</span>
        </h1>
        <p className="text-gray-600">Track your time-off and shift-swap requests.</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          to="/worker/request-time-off"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow transition-shadow cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#e6f0ec" }}>
            <CalendarX size={18} style={{ color: "#00523E" }} />
          </div>
          <div>
            <div className="font-medium">Request Time Off</div>
            <div className="text-sm text-gray-500">Submit a new time-off request</div>
          </div>
        </Link>
        <Link
          to="/worker/shift-swap"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow transition-shadow cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#e6f0ec" }}>
            <ArrowLeftRight size={18} style={{ color: "#00523E" }} />
          </div>
          <div>
            <div className="font-medium">Swap Shift</div>
            <div className="text-sm text-gray-500">Request a shift swap</div>
          </div>
        </Link>
        <Link
          to="/worker/update-availability"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow transition-shadow cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#e6f0ec" }}>
            <Clock size={18} style={{ color: "#00523E" }} />
          </div>
          <div>
            <div className="font-medium">Update Availability</div>
            <div className="text-sm text-gray-500">Set your weekly availability</div>
          </div>
        </Link>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? "text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={filter === f ? { backgroundColor: "#00523E" } : {}}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Requests list */}
      <div id="requests-list" className="space-y-4 scroll-mt-24">
        {visible.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            No requests found.
          </div>
        ) : (
          visible.map((req) => {
            const status = req.status;
            const pending = status === "PENDING";
            return (
              <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      req._type === "TIMEOFF" ? "bg-blue-50" : "bg-purple-50"
                    }`}>
                      {req._type === "TIMEOFF"
                        ? <CalendarX size={18} className="text-blue-600" />
                        : <ArrowLeftRight size={18} className="text-purple-600" />}
                    </div>
                    <div>
                      <div className="font-medium">
                        {req._type === "TIMEOFF" ? "Time-Off Request" : "Shift Swap Request"}
                      </div>
                      {req._type === "TIMEOFF" && (
                        <div className="text-sm text-gray-500">
                          {fmt(req.startDate)} – {fmt(req.endDate)}
                        </div>
                      )}
                      {req.reason && (
                        <div className="text-sm text-gray-500 mt-1">{req.reason}</div>
                      )}
                      {req.reviewNotes && (
                        <div className="text-sm text-gray-500 italic mt-1">Note: {req.reviewNotes}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Submitted {fmt(req.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      pending                                    ? "bg-yellow-50 text-yellow-700" :
                      status === "APPROVED" || status === "ACCEPTED" ? "bg-green-50 text-green-700" :
                      "bg-red-50 text-red-600"
                    }`}>
                      {status}
                    </span>
                    {pending && (
                      <button
                        onClick={() => handleCancel(req)}
                        disabled={cancelling === req.id}
                        className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        {cancelling === req.id ? "Cancelling…" : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
