import { useEffect, useState } from "react";
import { X, Plus, AlertCircle } from "lucide-react";
import * as shiftsApi from "../../api/shifts";
import * as availabilityApi from "../../api/availability";
import * as timeoffApi from "../../api/timeoff";
import * as supervisorsApi from "../../api/supervisors";

export default function CreateShiftModal({ workers, onClose, onCreated }) {
  // Build an ISO datetime string that preserves the browser's local timezone offset
  // so the backend can extract the correct local HH:MM for availability comparison.
  const toLocalISO = (dateStr, timeStr) => {
    const dt = new Date(`${dateStr}T${timeStr}`);
    const offsetMin = dt.getTimezoneOffset(); // minutes BEHIND UTC (positive = behind UTC)
    const sign = offsetMin <= 0 ? "+" : "-";
    const absMin = Math.abs(offsetMin);
    const hh = String(Math.floor(absMin / 60)).padStart(2, "0");
    const mm = String(absMin % 60).padStart(2, "0");
    const fullTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    return `${dateStr}T${fullTime}${sign}${hh}:${mm}`;
  };
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  const [loadingWorkerSchedule, setLoadingWorkerSchedule] = useState(false);
  const [workerAvailability, setWorkerAvailability] = useState([]);
  const [approvedTimeOff, setApprovedTimeOff] = useState([]);
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatEndDate, setRepeatEndDate] = useState("");
  const [locationName, setLocationName] = useState("");
  const [savedLocations, setSavedLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [savingLocation, setSavingLocation] = useState(false);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  useEffect(() => {
    if (!selectedWorkerId) {
      setWorkerAvailability([]);
      setApprovedTimeOff([]);
      return;
    }

    let active = true;
    setLoadingWorkerSchedule(true);
    Promise.all([
      availabilityApi.workerAvailability(selectedWorkerId),
      timeoffApi.workerTimeOff(selectedWorkerId),
    ])
      .then(([availability, requests]) => {
        if (!active) return;
        setWorkerAvailability(availability);
        setApprovedTimeOff(
          requests.filter((request) => String(request.status) === "APPROVED"),
        );
      })
      .catch(() => {
        if (!active) return;
        setWorkerAvailability([]);
        setApprovedTimeOff([]);
      })
      .finally(() => {
        if (active) setLoadingWorkerSchedule(false);
      });

    return () => {
      active = false;
    };
  }, [selectedWorkerId]);

  useEffect(() => {
    let active = true;
    setLoadingLocations(true);
    supervisorsApi
      .listLocations()
      .then((locations) => {
        if (!active) return;
        setSavedLocations(locations);
      })
      .catch(() => {
        if (!active) return;
        setSavedLocations([]);
      })
      .finally(() => {
        if (active) setLoadingLocations(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const normalizedLocation = locationName.trim();
  const hasMatchingSavedLocation = savedLocations.some(
    (location) => location.name.toLowerCase() === normalizedLocation.toLowerCase(),
  );

  const saveCurrentLocation = async () => {
    if (!normalizedLocation || hasMatchingSavedLocation) return;

    setSavingLocation(true);
    try {
      const created = await supervisorsApi.createLocation(normalizedLocation);
      setSavedLocations((prev) =>
        [...prev, created].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      );
      setLocationName(created.name);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ?? "Failed to save location.",
      );
    } finally {
      setSavingLocation(false);
    }
  };

  const removeSavedLocation = async (locationId) => {
    try {
      await supervisorsApi.deleteLocation(locationId);
      setSavedLocations((prev) => prev.filter((item) => item.id !== locationId));
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ?? "Failed to delete location.",
      );
    }
  };

  const withinAvailability = () => {
    if (!selectedWorkerId || !selectedDate || !selectedStartTime || !selectedEndTime) {
      return true;
    }

    const jsDay = new Date(`${selectedDate}T00:00:00`).getDay(); // Sun=0
    const dayOfWeek = (jsDay + 6) % 7; // Mon=0 .. Sun=6
    const slotsForDay = workerAvailability.filter((slot) => slot.dayOfWeek === dayOfWeek);
    // If the worker has no slots configured for this day, treat it as open (no constraint).
    if (slotsForDay.length === 0) return true;
    return slotsForDay.some(
      (slot) =>
        slot.startTime <= selectedStartTime
        && slot.endTime >= selectedEndTime,
    );
  };

  const overlapsApprovedTimeOff = (startIso, endIso) => {
    const start = new Date(startIso);
    const end = new Date(endIso);
    return approvedTimeOff.some((request) => {
      const requestStart = new Date(request.startDate);
      const requestEnd = new Date(request.endDate);
      return requestStart < end && requestEnd > start;
    });
  };

  const selectedShiftStartIso =
    selectedDate && selectedStartTime
      ? new Date(`${selectedDate}T${selectedStartTime}`).toISOString()
      : null;
  const selectedShiftEndIso =
    selectedDate && selectedEndTime
      ? new Date(`${selectedDate}T${selectedEndTime}`).toISOString()
      : null;
  const hasSelectedShiftWindow = Boolean(selectedShiftStartIso && selectedShiftEndIso);
  const hasValidTimeRange = hasSelectedShiftWindow
    ? new Date(selectedShiftEndIso) > new Date(selectedShiftStartIso)
    : true;
  const autoExpectedHours = hasSelectedShiftWindow && hasValidTimeRange
    ? ((new Date(selectedShiftEndIso) - new Date(selectedShiftStartIso)) / 3_600_000).toFixed(2)
    : null;
  const selectedWorkerFitsAvailability = withinAvailability();
  const selectedWorkerHasTimeOffConflict =
    hasSelectedShiftWindow && hasValidTimeRange
      ? overlapsApprovedTimeOff(selectedShiftStartIso, selectedShiftEndIso)
      : false;

  const scheduleValidationIssues = [];
  if (selectedWorkerId && hasSelectedShiftWindow && !hasValidTimeRange) {
    scheduleValidationIssues.push("End time must be after start time.");
  }
  if (
    selectedWorkerId
    && hasSelectedShiftWindow
    && hasValidTimeRange
    && !selectedWorkerFitsAvailability
  ) {
    scheduleValidationIssues.push("Selected shift is outside this worker's availability.");
  }
  if (selectedWorkerId && selectedWorkerHasTimeOffConflict) {
    scheduleValidationIssues.push("Selected shift overlaps approved time-off.");
  }

  const showLiveValidation =
    Boolean(selectedWorkerId)
    && Boolean(selectedDate)
    && Boolean(selectedStartTime)
    && Boolean(selectedEndTime)
    && !loadingWorkerSchedule;
  const shiftIsAssignable = showLiveValidation && scheduleValidationIssues.length === 0;
  const submitDisabled = loading || (showLiveValidation && !shiftIsAssignable);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const fd = new FormData(e.target);
    if (!normalizedLocation) {
      setError("Location is required.");
      setLoading(false);
      return;
    }

    const body = {
      title: fd.get("title"),
      location: normalizedLocation,
      description: fd.get("description") || undefined,
      start_time: toLocalISO(fd.get("date"), fd.get("startTime")),
      end_time:   toLocalISO(fd.get("date"), fd.get("endTime")),
      repeat_weekly: repeatWeekly,
      repeat_end_date: repeatWeekly && repeatEndDate
        ? toLocalISO(repeatEndDate, "23:59:59")
        : undefined,
    };

    if (selectedWorkerId && !hasValidTimeRange) {
      setError("End time must be after start time.");
      setLoading(false);
      return;
    }

    if (selectedWorkerId && !selectedWorkerFitsAvailability) {
      setError("Shift is outside this worker's availability.");
      setLoading(false);
      return;
    }

    if (selectedWorkerId && selectedWorkerHasTimeOffConflict) {
      setError("Shift overlaps this worker's approved time-off.");
      setLoading(false);
      return;
    }

    try {
      const shift = await shiftsApi.createShift(body);
      // Optionally assign a worker immediately
      const workerId = selectedWorkerId;
      if (workerId) {
        await shiftsApi.assignWorker(shift.id, workerId, repeatWeekly);
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
            <div className="space-y-2">
              <input
                name="location"
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                list="supervisor-location-options"
                placeholder="Type or select a saved location"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00523E] focus:border-transparent"
              />
              <datalist id="supervisor-location-options">
                {savedLocations.map((location) => (
                  <option key={location.id} value={location.name} />
                ))}
              </datalist>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={saveCurrentLocation}
                  disabled={!normalizedLocation || hasMatchingSavedLocation || savingLocation}
                  className="px-2.5 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {savingLocation ? "Saving..." : "Save as custom location"}
                </button>
                <span className="text-gray-500">
                  {loadingLocations
                    ? "Loading saved locations..."
                    : `${savedLocations.length} saved location${savedLocations.length === 1 ? "" : "s"}`}
                </span>
              </div>
              {savedLocations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {savedLocations.map((location) => (
                    <div
                      key={location.id}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
                    >
                      <button
                        type="button"
                        onClick={() => setLocationName(location.name)}
                        className="hover:underline"
                      >
                        {location.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSavedLocation(location.id)}
                        className="text-gray-500 hover:text-red-600"
                        aria-label={`Delete ${location.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input
                name="date" type="date" required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00523E] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
              <input
                name="startTime" type="time" required
                value={selectedStartTime}
                onChange={(e) => setSelectedStartTime(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00523E] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
              <input
                name="endTime" type="time" required
                value={selectedEndTime}
                onChange={(e) => setSelectedEndTime(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00523E] focus:border-transparent"
              />
            </div>
          </div>

          {/* Expected hours (auto-calculated) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expected Hours (auto)</label>
            <div className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-700">
              {autoExpectedHours ? `${autoExpectedHours} hours` : "Select start and end times"}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={repeatWeekly}
                onChange={(e) => setRepeatWeekly(e.target.checked)}
              />
              Repeat this shift weekly
            </label>
            {repeatWeekly && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Repeat until (optional)
                </label>
                <input
                  type="date"
                  value={repeatEndDate}
                  onChange={(e) => setRepeatEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If not set, recurrence uses admin semester dates.
                </p>
              </div>
            )}
          </div>

          {/* Assign worker (optional) */}
          {workers?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Worker (optional)</label>
              <select
                name="worker"
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00523E] focus:border-transparent"
              >
                <option value="">Don't assign yet</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.user?.firstName ?? ""} {w.user?.lastName ?? ""}
                  </option>
                ))}
              </select>

              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                {loadingWorkerSchedule ? (
                  <p>Loading worker availability...</p>
                ) : selectedWorkerId ? (
                  <>
                    <p className="font-medium mb-1">Availability</p>
                    {workerAvailability.length === 0 ? (
                      <p className="mb-2 text-red-600">No availability set.</p>
                    ) : (
                      <ul className="space-y-1 mb-2">
                        {workerAvailability.map((slot) => (
                          <li key={slot.id}>
                            {dayNames[slot.dayOfWeek]} {slot.startTime} - {slot.endTime}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="font-medium mb-1">Approved Time-Off</p>
                    {approvedTimeOff.length === 0 ? (
                      <p>None</p>
                    ) : (
                      <ul className="space-y-1">
                        {approvedTimeOff.map((request) => (
                          <li key={request.id}>
                            {new Date(request.startDate).toLocaleString()} to {new Date(request.endDate).toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    )}

                    {showLiveValidation && (
                      <div
                        className={`mt-3 rounded-lg border px-3 py-2 ${
                          shiftIsAssignable
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        <p className="font-semibold mb-1">
                          {shiftIsAssignable
                            ? "Available for this shift"
                            : "Not available for this shift"}
                        </p>
                        {!shiftIsAssignable && (
                          <ul className="space-y-1">
                            {scheduleValidationIssues.map((issue) => (
                              <li key={issue}>- {issue}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p>Select a worker to view availability and approved time-off.</p>
                )}
              </div>
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
              type="submit" disabled={submitDisabled}
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
