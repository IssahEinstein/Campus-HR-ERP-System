import { useState } from "react";
import { X, Plus, AlertCircle } from "lucide-react";
import * as shiftsApi from "../../api/shifts";

const LOCATIONS = [
  "Student Center - Front Desk",
  "Library - Reference Desk",
  "Library - Circulation Desk",
  "Admin Office - Reception",
  "Cafeteria - Service Counter",
  "Gym - Equipment Room",
];

export default function CreateShiftModal({ workers, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const fd = new FormData(e.target);
    const body = {
      title: fd.get("title"),
      location: fd.get("location"),
      description: fd.get("description") || undefined,
      start_time: new Date(`${fd.get("date")}T${fd.get("startTime")}`).toISOString(),
      end_time:   new Date(`${fd.get("date")}T${fd.get("endTime")}`).toISOString(),
      expected_hours: parseFloat(fd.get("hours")) || undefined,
    };
    try {
      const shift = await shiftsApi.createShift(body);
      // Optionally assign a worker immediately
      const workerId = fd.get("worker");
      if (workerId) {
        await shiftsApi.assignWorker(shift.id, workerId);
      }
      onCreated?.(shift);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail ?? "Failed to create shift");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create New Shift</h2>
            <p className="text-sm text-gray-600 mt-1">Schedule a shift for your team</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shift Title *</label>
            <input
              name="title" type="text" required
              placeholder="e.g., Morning Library Shift"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00523E] focus:border-transparent"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
            <select
              name="location" required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00523E] focus:border-transparent"
            >
              <option value="">Select location</option>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input
                name="date" type="date" required
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00523E] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
              <input
                name="startTime" type="time" required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00523E] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
              <input
                name="endTime" type="time" required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00523E] focus:border-transparent"
              />
            </div>
          </div>

          {/* Expected hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expected Hours</label>
            <input
              name="hours" type="number" step="0.5" min="0.5" max="12" placeholder="4"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00523E] focus:border-transparent"
            />
          </div>

          {/* Assign worker (optional) */}
          {workers?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Worker (optional)</label>
              <select
                name="worker"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00523E] focus:border-transparent"
              >
                <option value="">Don't assign yet</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.user?.firstName ?? ""} {w.user?.lastName ?? ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instructions (optional)</label>
            <textarea
              name="description" rows={3}
              placeholder="Special instructions for the worker..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00523E] focus:border-transparent resize-none"
            />
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-blue-700 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                The assigned worker will see this shift in their schedule immediately.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#00523E" }}
            >
              <Plus size={18} />
              {loading ? "Creating…" : "Create Shift"}
            </button>
            <button
              type="button" onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
