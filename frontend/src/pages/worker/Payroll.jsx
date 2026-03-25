import { useEffect, useState } from "react";
import * as payrollApi from "../../api/payroll";
import PayStubModal from "../../components/modals/PayStubModal";

export default function WorkerPayroll() {
  const [stubs,   setStubs]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    payrollApi.myPayStubs()
      .then((data) => setStubs(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (iso) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const currency = (n) => `$${(Number(n) || 0).toFixed(2)}`;

  const ytd = stubs
    .filter((s) => s.status === "PAID")
    .reduce((sum, s) => sum + (Number(s.netPay) || 0), 0);
  const latest = stubs[0] ?? null;

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">
          <span className="font-medium" style={{ color: "#00523E" }}>Payroll</span>
        </h1>
        <p className="text-gray-600">Your earnings and pay stub history.</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Year-to-Date Earnings</div>
          <div className="text-3xl font-bold" style={{ color: "#00523E" }}>{currency(ytd)}</div>
          <div className="text-xs text-gray-400 mt-1">Net pay (paid stubs)</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Latest Pay Stub</div>
          <div className="text-3xl font-bold text-gray-800">{latest ? currency(latest.netPay) : "—"}</div>
          {latest && <div className="text-xs text-gray-400 mt-1">{fmt(latest.periodStart)} – {fmt(latest.periodEnd)}</div>}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Total Hours (Latest)</div>
          <div className="text-3xl font-bold text-gray-800">{latest ? (Number(latest.totalHours) || 0).toFixed(1) : "—"}</div>
          <div className="text-xs text-gray-400 mt-1">hours</div>
        </div>
      </div>

      {/* Stubs table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium">Pay Stub History</h2>
        </div>
        {stubs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No pay stubs yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-left font-medium text-gray-500">Period</th>
                  <th className="p-4 text-right font-medium text-gray-500">Hours</th>
                  <th className="p-4 text-right font-medium text-gray-500">Gross</th>
                  <th className="p-4 text-right font-medium text-gray-500">Net</th>
                  <th className="p-4 text-center font-medium text-gray-500">Status</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stubs.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-700">
                      {fmt(s.periodStart)} – {fmt(s.periodEnd)}
                    </td>
                    <td className="p-4 text-right text-gray-700">{(Number(s.totalHours) || 0).toFixed(1)}</td>
                    <td className="p-4 text-right text-gray-700">{currency(s.grossPay)}</td>
                    <td className="p-4 text-right font-medium text-gray-900">{currency(s.netPay)}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        s.status === "PAID"    ? "bg-green-50 text-green-700" :
                        s.status === "PENDING" ? "bg-yellow-50 text-yellow-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        className="text-sm font-medium hover:underline"
                        style={{ color: "#00523E" }}
                        onClick={() => setSelected(s)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <PayStubModal stub={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
