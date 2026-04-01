import { useEffect, useState } from "react";
import {
  X, MapPin, Clock, Phone, Mail, FileText,
  CheckCircle, LogIn, LogOut, AlertTriangle,
} from "lucide-react";
import * as attendanceApi from "../../api/attendance";

export default function ShiftDetailsModal({ assignment, onClose, onCheckedIn, onCheckedOut }) {
  const shift = assignment?.shift ?? assignment;
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [attendanceRecord, setAttendanceRecord] = useState(assignment?.checkInRecord ?? null);

  useEffect(() => {
    setAttendanceRecord(assignment?.checkInRecord ?? null);
  }, [assignment]);

  const isToday = shift?.startTime
    ? new Date(shift.startTime).toDateString() === new Date().toDateString()
    : false;

  const handleCheckIn = async () => {
    setLoading(true); setError(null);
    try {
      const record = await attendanceApi.checkIn(assignment.id);
      setAttendanceRecord(record);
      onCheckedIn?.(record);
    } catch (e) {
      setError(e.response?.data?.detail ?? "Check-in failed");
    } finally { setLoading(false); }
  };

  const handleCheckOut = async () => {
    setLoading(true); setError(null);
    try {
      const record = await attendanceApi.checkOut(attendanceRecord.id);
      setAttendanceRecord(record);
      onCheckedOut?.(record);
    } catch (e) {
      setError(e.response?.data?.detail ?? "Check-out failed");
    } finally { setLoading(false); }
  };

  if (!shift) return null;

  const fmt = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
  const fmtFull = (iso) => iso ? new Date(iso).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={20} className="text-gray-400" />
                <h2 className="text-2xl font-light">
                  <span className="font-medium" style={{ color: "#00523E" }}>{shift.title ?? shift.location}</span>
                </h2>
              </div>
              <p className="text-gray-600">{fmtFull(shift.startTime)}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {/* Status */}
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
              shift.status === "SCHEDULED" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
            }`}>
              <CheckCircle size={16} />
              {shift.status ?? "SCHEDULED"}
            </span>
            {shift.expectedHours && (
              <span className="text-sm text-gray-600">{shift.expectedHours} hrs expected</span>
            )}
          </div>

          {/* Details */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <h3 className="font-medium text-gray-900">Shift Details</h3>
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Time</p>
                <p className="text-sm text-gray-600">{fmt(shift.startTime)} – {fmt(shift.endTime)}</p>
              </div>
            </div>
            {shift.location && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Location</p>
                  <p className="text-sm text-gray-600">{shift.location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description / instructions */}
          {shift.description && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">Instructions</h3>
                  <p className="text-sm text-blue-800">{shift.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Check-in / out controls */}
          {(isToday || (attendanceRecord && !attendanceRecord.checkedOutAt)) && (
            <div className="space-y-3">
              {!attendanceRecord && isToday ? (
                <button
                  onClick={handleCheckIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-white px-6 py-4 rounded-lg font-medium hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: "#00523E" }}
                >
                  <LogIn size={20} />
                  {loading ? "Checking in…" : "Check In to Shift"}
                </button>
              ) : !attendanceRecord.checkedOutAt ? (
                <button
                  onClick={handleCheckOut}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-white px-6 py-4 rounded-lg font-medium hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: "#00523E" }}
                >
                  <LogOut size={20} />
                  {loading ? "Checking out…" : "Check Out of Shift"}
                </button>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 text-center">
                  ✓ Shift complete — checked out at {fmt(attendanceRecord.checkedOutAt)}
                </div>
              )}

              <button
                className="w-full flex items-center justify-center gap-2 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
              >
                <AlertTriangle size={18} />
                Report Issue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
