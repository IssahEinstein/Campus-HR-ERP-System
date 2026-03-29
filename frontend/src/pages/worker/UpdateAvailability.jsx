import { useEffect, useState } from "react";
import * as availabilityApi from "../../api/availability";

const DAYS = [
  { short: "Mon", full: "Monday", idx: 1 },
  { short: "Tue", full: "Tuesday", idx: 2 },
  { short: "Wed", full: "Wednesday", idx: 3 },
  { short: "Thu", full: "Thursday", idx: 4 },
  { short: "Fri", full: "Friday", idx: 5 },
  { short: "Sat", full: "Saturday", idx: 6 },
  { short: "Sun", full: "Sunday", idx: 0 },
];

const defaultSlot = () => ({
  enabled: false,
  startTime: "09:00",
  endTime: "17:00",
  id: null,
});

export default function UpdateAvailability() {
  // dayIdx → slot state
  const [slots, setSlots] = useState(
    Object.fromEntries(DAYS.map((d) => [d.idx, defaultSlot()])),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    availabilityApi
      .myAvailability()
      .then((data) => {
        setSlots((prev) => {
          const next = { ...prev };
          for (const av of data) {
            next[av.dayOfWeek] = {
              enabled: true,
              startTime: av.startTime?.slice(0, 5) ?? "09:00",
              endTime: av.endTime?.slice(0, 5) ?? "17:00",
              id: av.id,
            };
          }
          return next;
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (idx) =>
    setSlots((s) => ({ ...s, [idx]: { ...s[idx], enabled: !s[idx].enabled } }));

  const updateField = (idx, field, value) =>
    setSlots((s) => ({ ...s, [idx]: { ...s[idx], [field]: value } }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const [existing] = await Promise.all([availabilityApi.myAvailability()]);
      const existingMap = Object.fromEntries(
        existing.map((a) => [a.dayOfWeek, a]),
      );

      for (const day of DAYS) {
        const slot = slots[day.idx];
        const exist = existingMap[day.idx];

        if (slot.enabled) {
          const payload = {
            day_of_week: day.idx,
            start_time: slot.startTime,
            end_time: slot.endTime,
          };
          if (exist) {
            await availabilityApi.updateAvailability(exist.id, payload);
          } else {
            await availabilityApi.createAvailability(payload);
          }
        } else if (exist) {
          await availabilityApi.deleteAvailability(exist.id);
        }
      }
      setSuccess(true);
    } catch (e) {
      setError(e.response?.data?.detail ?? "Failed to save availability.");
    } finally {
      setSaving(false);
    }
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
        <h1 className="text-3xl font-light mb-2">
          <span className="font-medium" style={{ color: "#00523E" }}>
            Update Availability
          </span>
        </h1>
        <p className="text-gray-600">
          Set the days and times you are available to work.
        </p>
      </div>

      <div
        className="rounded-2xl divide-y"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.78) 0%, rgba(242,250,245,0.88) 100%)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(0,82,62,0.11)",
          boxShadow:
            "0 8px 40px rgba(0,82,62,0.09), inset 0 1px 0 rgba(255,255,255,0.95)",
          borderColor: "rgba(0,82,62,0.07)",
        }}
      >
        {DAYS.map((day) => {
          const slot = slots[day.idx];
          return (
            <div
              key={day.idx}
              className="p-4 sm:p-6 flex items-center gap-4 flex-wrap sm:flex-nowrap"
            >
              {/* Toggle */}
              <button
                onClick={() => toggle(day.idx)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                  slot.enabled ? "" : "bg-gray-200"
                }`}
                style={slot.enabled ? { backgroundColor: "#00523E" } : {}}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    slot.enabled ? "translate-x-5" : ""
                  }`}
                />
              </button>
              <span className="w-24 font-medium text-gray-700">{day.full}</span>
              {slot.enabled ? (
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) =>
                      updateField(day.idx, "startTime", e.target.value)
                    }
                    className="border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) =>
                      updateField(day.idx, "endTime", e.target.value)
                    }
                    className="border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1"
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-400 italic">
                  Unavailable
                </span>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 bg-green-50 text-green-700 text-sm p-3 rounded-lg">
          Availability saved successfully.
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 hover:opacity-90"
          style={{ backgroundColor: "#00523E" }}
        >
          {saving ? "Saving…" : "Save Availability"}
        </button>
      </div>
    </div>
  );
}
