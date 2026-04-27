import { useEffect, useMemo, useState } from "react";
import { DollarSign, FileText, PlusCircle, RefreshCw } from "lucide-react";
import * as supervisorsApi from "../../api/supervisors";
import * as payrollApi from "../../api/payroll";

const currency = (value) => `$${(Number(value) || 0).toFixed(2)}`;

function normalizeWorker(worker) {
  return {
    id: worker.id,
    name: `${worker.user?.firstName ?? ""} ${worker.user?.lastName ?? ""}`.trim() || "Unnamed",
    email: worker.user?.email ?? "",
    workerId: worker.workerId,
  };
}

export default function SupervisorPayroll() {
  const [workers, setWorkers] = useState([]);
  const [allStubs, setAllStubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [form, setForm] = useState({
    pay_period_start: "",
    pay_period_end: "",
    hourly_rate: "15",
    tax_rate: "0",
    deductions: "0",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [workerData, stubsData] = await Promise.all([
        supervisorsApi.myWorkers(),
        payrollApi.allPayStubs(),
      ]);

      const normalizedWorkers = (Array.isArray(workerData) ? workerData : [])
        .map(normalizeWorker)
        .filter((w) => String(w.id || "").length > 0);

      const stubs = Array.isArray(stubsData) ? stubsData : [];

      setWorkers(normalizedWorkers);
      setAllStubs(stubs);
      if (!selectedWorkerId && normalizedWorkers.length > 0) {
        setSelectedWorkerId(normalizedWorkers[0].id);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.detail ?? "Failed to load payroll data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const workerMap = useMemo(() => {
    const map = new Map();
    workers.forEach((w) => map.set(w.id, w));
    return map;
  }, [workers]);

  const filteredStubs = useMemo(() => {
    return allStubs
      .filter((stub) => !selectedWorkerId || stub.workerId === selectedWorkerId)
      .filter((stub) => statusFilter === "ALL" || String(stub.status) === statusFilter)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allStubs, selectedWorkerId, statusFilter]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toIsoStart = (dateText) => `${dateText}T00:00:00.000Z`;
  const toIsoEnd = (dateText) => `${dateText}T23:59:59.999Z`;

  const submitGenerate = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!selectedWorkerId) {
      setError("Select a worker first.");
      return;
    }

    if (!form.pay_period_start || !form.pay_period_end) {
      setError("Provide pay period start and end dates.");
      return;
    }

    const body = {
      worker_id: selectedWorkerId,
      pay_period_start: toIsoStart(form.pay_period_start),
      pay_period_end: toIsoEnd(form.pay_period_end),
      hourly_rate: Number(form.hourly_rate || 0),
      tax_rate: Number(form.tax_rate || 0),
      deductions: Number(form.deductions || 0),
      notes: form.notes || undefined,
    };

    setSubmitting(true);
    try {
      await payrollApi.generatePayStub(body);
      setMessage("Pay stub generated successfully.");
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.detail ?? "Failed to generate pay stub.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">
          <span className="font-medium" style={{ color: "#00523E" }}>
            Payroll
          </span>
        </h1>
        <p className="text-gray-600">Generate and review pay stubs for your team.</p>
      </div>

      {message && (
        <div className="mb-4 rounded-lg px-4 py-3 text-sm bg-green-50 text-green-700 border border-green-200">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <form
            onSubmit={submitGenerate}
            className="rounded-2xl p-6 space-y-4"
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
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <PlusCircle size={18} /> Generate Pay Stub
            </h2>

            <label className="block text-sm text-gray-700">
              Worker
              <select
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                required
              >
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} ({worker.workerId})
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-gray-700">
                Period Start
                <input
                  type="date"
                  name="pay_period_start"
                  value={form.pay_period_start}
                  onChange={handleFormChange}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="block text-sm text-gray-700">
                Period End
                <input
                  type="date"
                  name="pay_period_end"
                  value={form.pay_period_end}
                  onChange={handleFormChange}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="block text-sm text-gray-700">
                Hourly Rate
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="hourly_rate"
                  value={form.hourly_rate}
                  onChange={handleFormChange}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="block text-sm text-gray-700">
                Tax Rate
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="0.99"
                  name="tax_rate"
                  value={form.tax_rate}
                  onChange={handleFormChange}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm text-gray-700">
                Deductions
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="deductions"
                  value={form.deductions}
                  onChange={handleFormChange}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </label>
            </div>

            <label className="block text-sm text-gray-700">
              Notes
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleFormChange}
                rows={3}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Optional payroll note"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 text-white px-4 py-3 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#00523E" }}
            >
              <DollarSign size={16} /> {submitting ? "Generating..." : "Generate Stub"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.78) 0%, rgba(242,250,245,0.88) 100%)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(0,82,62,0.11)",
          boxShadow:
            "0 8px 40px rgba(0,82,62,0.09), inset 0 1px 0 rgba(255,255,255,0.95)",
        }}>
          <div className="p-6 border-b" style={{ borderColor: "rgba(0,82,62,0.09)" }}>
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText size={18} /> Pay Stubs
              </h2>
              <div className="flex items-center gap-2">
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All statuses</option>
                  <option value="GENERATED">Generated</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PAID">Paid</option>
                </select>
                <button
                  onClick={load}
                  className="inline-flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </div>
          </div>

          {filteredStubs.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No pay stubs found for current filters.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(0,82,62,0.07)" }}>
              {filteredStubs.map((stub) => {
                const worker = workerMap.get(stub.workerId);
                return (
                  <div key={stub.id} className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {worker?.name ?? "Unknown worker"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {stub.payPeriodStart?.slice(0, 10)} to {stub.payPeriodEnd?.slice(0, 10)}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {stub.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Hours</p>
                        <p className="font-medium">{Number(stub.totalHours || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Hourly Rate</p>
                        <p className="font-medium">{currency(stub.hourlyRate)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Gross</p>
                        <p className="font-medium">{currency(stub.grossPay)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Net</p>
                        <p className="font-medium">{currency(stub.netPay)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
