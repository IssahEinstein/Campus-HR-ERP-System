import { X, DollarSign, FileText, Clock, Calendar, Download, Printer, AlertCircle, CheckCircle } from "lucide-react";

export default function PayStubModal({ stub, onClose }) {
  if (!stub) return null;

  const fmt = (n) => Number(n ?? 0).toFixed(2);
  const gross  = Number(stub.grossPay ?? 0);
  const net    = Number(stub.netPay ?? 0);
  const dedTotal = gross - net;
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Pay Stub Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              {fmtDate(stub.payPeriodStart)} – {fmtDate(stub.payPeriodEnd)}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={18} className="text-green-700" />
                <p className="text-sm text-green-700 font-medium">Gross Pay</p>
              </div>
              <p className="text-2xl font-bold text-green-900">${fmt(gross)}</p>
              <p className="text-xs text-green-700 mt-1">{stub.totalHours ?? "—"} hours worked</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={18} className="text-blue-700" />
                <p className="text-sm text-blue-700 font-medium">Deductions</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">${fmt(dedTotal)}</p>
              <p className="text-xs text-blue-700 mt-1">
                {gross > 0 ? ((dedTotal / gross) * 100).toFixed(1) : 0}% of gross
              </p>
            </div>
            <div className="rounded-xl p-4 border-2" style={{ backgroundColor: "#00523E", borderColor: "#003d2e" }}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={18} className="text-green-200" />
                <p className="text-sm text-green-200 font-medium">Net Pay</p>
              </div>
              <p className="text-2xl font-bold text-white">${fmt(net)}</p>
              <p className="text-xs text-green-200 mt-1">
                Status: {stub.status ?? "—"} {stub.paidAt ? `· ${fmtDate(stub.paidAt)}` : ""}
              </p>
            </div>
          </div>

          {/* Net pay calculation */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Net Pay Calculation</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Gross Pay</span>
                <span className="font-medium">${fmt(gross)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>- Total Deductions (estimated)</span>
                <span className="font-medium">${fmt(dedTotal)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-gray-300 text-base font-bold">
                <span className="text-gray-900">Net Pay</span>
                <span style={{ color: "#00523E" }}>${fmt(net)}</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-blue-700 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Need help understanding your pay stub?</p>
                <p>Contact HR at hr@university.edu or visit the Payroll Office in Admin Building, Room 201.</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => alert("PDF download would be triggered here")}
              className="flex items-center justify-center gap-2 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90"
              style={{ backgroundColor: "#00523E" }}
            >
              <Download size={18} />
              Download PDF
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 border-2 border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
            >
              <Printer size={18} />
              Print Pay Stub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
