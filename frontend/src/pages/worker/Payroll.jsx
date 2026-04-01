import { useEffect, useState } from "react";
import {
  Clock,
  DollarSign,
  Calendar,
  FileText,
  Download,
  Printer,
  CheckCircle,
} from "lucide-react";
import * as payrollApi from "../../api/payroll";
import PayStubModal from "../../components/modals/PayStubModal";

export default function WorkerPayroll() {
  const [stubs, setStubs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    payrollApi
      .myPayStubs()
      .then((data) => setStubs(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  const currency = (n) => `$${(Number(n) || 0).toFixed(2)}`;

  const paidStubs = stubs.filter((s) => s.status === "PAID");
  const ytdNet = paidStubs.reduce((sum, s) => sum + (Number(s.netPay) || 0), 0);
  const ytdGross = paidStubs.reduce(
    (sum, s) => sum + (Number(s.grossPay) || 0),
    0,
  );
  const ytdHours = paidStubs.reduce(
    (sum, s) => sum + (Number(s.totalHours) || 0),
    0,
  );

  const latest = stubs[0] ?? null;
  const currentPeriodHours = Number(latest?.totalHours || 0);
  const projectedGross = Number(latest?.grossPay || 0);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">
          <span className="font-medium" style={{ color: "#00523E" }}>
            Payroll
          </span>
        </h1>
        <p className="text-gray-600">View your earnings and payment history.</p>
      </div>

      {/* Earnings Overview Cards */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <div
          className="rounded-2xl p-6 min-w-[180px] w-[180px] h-[180px] flex-shrink-0 flex flex-col items-center justify-center text-center"
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
          <Clock size={24} className="text-gray-400 mb-3" />
          <div className="text-sm text-gray-600 mb-2">Current Period</div>
          <div className="text-3xl font-light mb-1">
            {currentPeriodHours.toFixed(0)}
            <span className="text-lg text-gray-600"> hrs</span>
          </div>
          <div className="text-xs text-gray-500">
            {latest
              ? `${fmtDate(latest.payPeriodStart)} – ${fmtDate(latest.payPeriodEnd)}`
              : "no data"}
          </div>
        </div>

        <div
          className="rounded-2xl p-6 min-w-[180px] w-[180px] h-[180px] flex-shrink-0 flex flex-col items-center justify-center text-center"
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
          <DollarSign size={24} className="text-gray-400 mb-3" />
          <div className="text-sm text-gray-600 mb-2">Projected Earnings</div>
          <div className="text-3xl font-light mb-1">
            {currency(projectedGross)}
          </div>
          <div className="text-xs text-gray-500">current period</div>
        </div>

        <div
          className="rounded-xl p-6 min-w-[180px] w-[180px] h-[180px] flex-shrink-0 flex flex-col items-center justify-center text-center"
          style={{ backgroundColor: "#00523E" }}
        >
          <Calendar size={24} className="text-green-300 mb-3" />
          <div className="text-sm text-green-200 mb-2">Net Pay (Latest)</div>
          <div className="text-3xl font-light mb-1 text-white">
            {latest ? currency(latest.netPay) : "—"}
          </div>
          <div className="text-xs text-green-300">
            {latest?.status === "PAID"
              ? "Paid"
              : latest
                ? "Pending"
                : "no stubs yet"}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Pay Stubs */}
        <div className="lg:col-span-2 space-y-6">
          <div
            className="rounded-2xl overflow-hidden"
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
            <div
              className="p-6 border-b"
              style={{ borderColor: "rgba(0,82,62,0.09)" }}
            >
              <h2 className="text-lg font-semibold">Pay Stubs</h2>
            </div>
            {stubs.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                No pay stubs yet.
              </div>
            ) : (
              <div
                className="divide-y"
                style={{ borderColor: "rgba(0,82,62,0.07)" }}
              >
                {stubs.map((s) => (
                  <div
                    key={s.id}
                    className="p-6 hover:bg-white/40 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium mb-1">
                          {fmtDate(s.payPeriodStart)} – {fmtDate(s.payPeriodEnd)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {(Number(s.totalHours) || 0).toFixed(1)} hours worked
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          s.status === "PAID"
                            ? "bg-green-50 text-green-700"
                            : s.status === "GENERATED"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {s.status === "GENERATED" ? "Pending" : s.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-600 mb-1">Gross Pay</p>
                        <p className="font-medium">{currency(s.grossPay)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Net Pay</p>
                        <p className="font-medium">{currency(s.netPay)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Pay Date</p>
                        <p className="font-medium">
                          {s.paidAt ? fmtDate(s.paidAt) : "—"}
                        </p>
                      </div>
                    </div>
                    <div
                      className="pt-3 border-t"
                      style={{ borderColor: "rgba(0,82,62,0.07)" }}
                    >
                      <button
                        onClick={() => setSelected(s)}
                        className="text-sm hover:underline"
                        style={{ color: "#00523E" }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Current Pay Period */}
          <div
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
            <h2 className="text-lg font-semibold mb-4">Current Pay Period</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Period</span>
                <span className="text-sm font-medium">
                  {latest
                    ? `${fmtDate(latest.payPeriodStart)} – ${fmtDate(latest.payPeriodEnd)}`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Hours Logged</span>
                <span className="text-sm font-medium">
                  {currentPeriodHours.toFixed(1)} hrs
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Gross Pay</span>
                <span className="text-sm font-medium">
                  {currency(projectedGross)}
                </span>
              </div>
              {latest?.netPay && (
                <div
                  className="pt-4 border-t"
                  style={{ borderColor: "rgba(0,82,62,0.09)" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Net Pay</span>
                    <span
                      className="text-lg font-medium"
                      style={{ color: "#00523E" }}
                    >
                      {currency(latest.netPay)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Year to Date */}
          <div
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
            <h2 className="text-lg font-medium mb-4">
              {new Date().getFullYear()} Year to Date
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Hours</span>
                <span className="text-sm font-medium">
                  {ytdHours.toFixed(1)} hrs
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Gross Earnings</span>
                <span className="text-sm font-medium">
                  {currency(ytdGross)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Net Earnings</span>
                <span className="text-sm font-medium">{currency(ytdNet)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div
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
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => alert("Download functionality coming soon.")}
                className="w-full flex items-center justify-center gap-2 text-white px-4 py-3 rounded-xl text-sm font-medium hover:opacity-90"
                style={{ backgroundColor: "#00523E" }}
              >
                <Download size={16} /> Download All Stubs
              </button>
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                style={{
                  border: "1px solid rgba(0,82,62,0.18)",
                  color: "#00523E",
                }}
              >
                <Printer size={16} /> Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <PayStubModal stub={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
