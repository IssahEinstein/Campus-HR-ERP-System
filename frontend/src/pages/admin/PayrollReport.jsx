import { useEffect, useState } from "react";
import {
  DollarSign,
  Clock,
  FileText,
  Building2,
  Download,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import * as adminApi from "../../api/admin";

const CARD_STYLE = {
  background:
    "linear-gradient(160deg, rgba(255,255,255,0.78) 0%, rgba(242,250,245,0.88) 100%)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(0,82,62,0.11)",
  boxShadow:
    "0 8px 40px rgba(0,82,62,0.09), inset 0 1px 0 rgba(255,255,255,0.95)",
};

const currency = (n) => `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function downloadCSV(rows, filename) {
  const headers = [
    "Department",
    "Pay Stubs",
    "Total Hours",
    "Gross Pay ($)",
    "Net Pay ($)",
  ];
  const lines = rows.map((r) => [
    r.department_name,
    r.paystub_count,
    Number(r.total_hours).toFixed(2),
    Number(r.total_gross_pay).toFixed(2),
    Number(r.total_net_pay).toFixed(2),
  ]);
  const csv = [headers, ...lines]
    .map((row) =>
      row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function PayrollReport() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getPayrollByDepartment();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.detail ?? "Failed to load payroll report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleExport = () => {
    if (!rows.length) return;
    downloadCSV(rows, `payroll-by-department-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    );

  if (error)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          className="rounded-2xl p-6 text-center"
          style={{ ...CARD_STYLE, color: "#d83b01" }}
        >
          {error}
        </div>
      </div>
    );

  const totalGross = rows.reduce((s, r) => s + Number(r.total_gross_pay || 0), 0);
  const totalNet = rows.reduce((s, r) => s + Number(r.total_net_pay || 0), 0);
  const totalHours = rows.reduce((s, r) => s + Number(r.total_hours || 0), 0);
  const totalStubs = rows.reduce((s, r) => s + (r.paystub_count || 0), 0);
  const maxGross = rows.length > 0 ? Math.max(...rows.map((r) => Number(r.total_gross_pay || 0))) : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light mb-2">
            <span className="font-medium" style={{ color: "#00523E" }}>
              Payroll
            </span>{" "}
            Report
          </h1>
          <p className="text-gray-600">
            Earnings aggregated by department across all pay stubs.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{
              background: "rgba(0,82,62,0.08)",
              color: "#00523E",
              border: "1px solid rgba(0,82,62,0.18)",
            }}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={rows.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "#00523E" }}
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        {[
          {
            icon: <DollarSign size={24} className="text-gray-400 mb-3" />,
            label: "Total Gross Pay",
            value: currency(totalGross),
          },
          {
            icon: <TrendingUp size={24} className="text-gray-400 mb-3" />,
            label: "Total Net Pay",
            value: currency(totalNet),
          },
          {
            icon: <Clock size={24} className="text-gray-400 mb-3" />,
            label: "Total Hours",
            value: `${totalHours.toFixed(1)} hrs`,
          },
          {
            icon: <FileText size={24} className="text-gray-400 mb-3" />,
            label: "Pay Stubs",
            value: totalStubs,
          },
          {
            icon: <Building2 size={24} className="text-gray-400 mb-3" />,
            label: "Departments",
            value: rows.length,
          },
        ].map(({ icon, label, value }) => (
          <div
            key={label}
            className="rounded-2xl p-6 min-w-[160px] flex-shrink-0 flex flex-col items-center justify-center text-center"
            style={CARD_STYLE}
          >
            {icon}
            <div className="text-sm text-gray-600 mb-1">{label}</div>
            <div className="text-2xl font-semibold" style={{ color: "#00523E" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Department breakdown */}
      {rows.length === 0 ? (
        <div className="rounded-2xl p-10 text-center text-gray-400" style={CARD_STYLE}>
          No payroll data found. Pay stubs need to be generated first.
        </div>
      ) : (
        <>
          {/* Bar chart cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {[...rows]
              .sort((a, b) => Number(b.total_gross_pay) - Number(a.total_gross_pay))
              .map((dept) => {
                const pct = Math.round(
                  (Number(dept.total_gross_pay || 0) / (maxGross || 1)) * 100,
                );
                return (
                  <div key={dept.department_id} className="rounded-2xl p-6" style={CARD_STYLE}>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(0,82,62,0.10)", color: "#00523E" }}
                      >
                        <Building2 size={16} />
                      </div>
                      <h3 className="font-semibold text-gray-800 leading-tight">
                        {dept.department_name}
                      </h3>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Gross Pay</span>
                        <span className="font-semibold" style={{ color: "#00523E" }}>
                          {currency(dept.total_gross_pay)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Net Pay</span>
                        <span className="font-medium text-gray-700">
                          {currency(dept.total_net_pay)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Hours</span>
                        <span className="font-medium text-gray-700">
                          {Number(dept.total_hours).toFixed(1)} hrs
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Pay Stubs</span>
                        <span className="font-medium text-gray-700">
                          {dept.paystub_count}
                        </span>
                      </div>
                    </div>

                    {/* Relative bar */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Relative spend</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: "linear-gradient(90deg, #00523E, #0d8c68)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Full data table */}
          <div className="rounded-2xl p-6" style={CARD_STYLE}>
            <h2 className="text-base font-semibold text-gray-800 mb-4">Full Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Department", "Pay Stubs", "Total Hours", "Gross Pay", "Net Pay"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left py-2 pr-4 text-xs uppercase tracking-wide text-gray-500 font-medium last:text-right"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[...rows]
                    .sort((a, b) => Number(b.total_gross_pay) - Number(a.total_gross_pay))
                    .map((dept) => (
                      <tr
                        key={dept.department_id}
                        className="border-b border-gray-50 hover:bg-white/50"
                      >
                        <td className="py-2 pr-4 font-medium text-gray-700">
                          {dept.department_name}
                        </td>
                        <td className="py-2 pr-4 text-gray-600">{dept.paystub_count}</td>
                        <td className="py-2 pr-4 text-gray-600">
                          {Number(dept.total_hours).toFixed(1)} hrs
                        </td>
                        <td className="py-2 pr-4 font-semibold" style={{ color: "#00523E" }}>
                          {currency(dept.total_gross_pay)}
                        </td>
                        <td className="py-2 text-right text-gray-700 font-medium">
                          {currency(dept.total_net_pay)}
                        </td>
                      </tr>
                    ))}
                  {/* Totals row */}
                  <tr className="border-t-2 border-gray-200 font-semibold bg-white/30">
                    <td className="py-3 pr-4 text-gray-800">Total</td>
                    <td className="py-3 pr-4 text-gray-800">{totalStubs}</td>
                    <td className="py-3 pr-4 text-gray-800">{totalHours.toFixed(1)} hrs</td>
                    <td className="py-3 pr-4" style={{ color: "#00523E" }}>
                      {currency(totalGross)}
                    </td>
                    <td className="py-3 text-right text-gray-800">{currency(totalNet)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
