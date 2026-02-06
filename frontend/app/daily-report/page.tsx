"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import * as XLSX from "xlsx";

interface DailyReport {
  _id: string;
  date: string;
  openingBalance: number;
  cashSale: number;
  upi: number;
  creditCard: number;
  creditNote: number;
  deposited: number;
  qty: number;
  note: string;
  totalSale: number;
  expense: number;
  closingBalance: number;
  net: number;
}

export default function DailyReportPage() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    openingBalance: 0,
    cashSale: 0,
    upi: 0,
    creditCard: 0,
    creditNote: 0,
    deposited: 0,
    qty: 0,
    note: "",
    expense: 0,
  });

  const [reports, setReports] = useState<DailyReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Calculate total sale
  const totalSale = formData.cashSale + formData.upi + formData.creditCard + formData.creditNote;
  // Opening balance is the most recent report's closing balance (reports are sorted newest first)
  // For the first entry ever, it should be editable
  const openingBalance = reports.length > 0 ? (reports[0].closingBalance || 0) : formData.openingBalance;
  const isFirstEntry = reports.length === 0;
  const closingBalance = openingBalance + formData.cashSale - formData.expense - formData.deposited;
  const net = openingBalance + totalSale - formData.expense - formData.deposited;

  // Fetch all reports
  const fetchReports = async () => {
    try {
      const response = await api.get("/daily-report");
      if (response.data.data && Array.isArray(response.data.data)) {
        setReports(response.data.data);
        console.log("✅ Reports fetched:", response.data.data.length, "records");
      } else {
        console.warn("⚠️ Unexpected response format:", response.data);
        setReports([]);
      }
    } catch (error) {
      console.error("❌ Error fetching reports:", error);
      setReports([]);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "date" || name === "note" ? value : parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await api.post("/daily-report", {
        ...formData,
        openingBalance,
      });
      
      setMessage({ type: "success", text: response.data.message });
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        openingBalance: 0,
        cashSale: 0,
        upi: 0,
        creditCard: 0,
        creditNote: 0,
        deposited: 0,
        qty: 0,
        note: "",
        expense: 0,
      });
      
      // Refresh reports to show new data
      await fetchReports();
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Network error. Please try again.";
      setMessage({ type: "error", text: errorMessage });
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasDraftData =
    formData.cashSale !== 0 ||
    formData.upi !== 0 ||
    formData.creditCard !== 0 ||
    formData.creditNote !== 0 ||
    formData.deposited !== 0 ||
    formData.qty !== 0 ||
    formData.expense !== 0 ||
    formData.note.trim() !== "" ||
    (isFirstEntry && formData.openingBalance !== 0);

  // Calculate totals for balance sheet (include current form values as a live preview)
  const calculateTotals = () => {
    if (reports.length === 0 && !hasDraftData) return null;

    const baseTotals = reports.reduce(
      (acc, report) => ({
        openingBalance: acc.openingBalance + (report.openingBalance || 0),
        cashSale: acc.cashSale + (report.cashSale || 0),
        upi: acc.upi + (report.upi || 0),
        creditCard: acc.creditCard + (report.creditCard || 0),
        creditNote: acc.creditNote + (report.creditNote || 0),
        deposited: acc.deposited + (report.deposited || 0),
        qty: acc.qty + (report.qty || 0),
        totalSale: acc.totalSale + (report.totalSale || 0),
        expense: acc.expense + (report.expense || 0),
        closingBalance: acc.closingBalance + (report.closingBalance || 0),
        net: acc.net + (report.net || 0),
      }),
      {
        openingBalance: 0,
        cashSale: 0,
        upi: 0,
        creditCard: 0,
        creditNote: 0,
        deposited: 0,
        qty: 0,
        totalSale: 0,
        expense: 0,
        closingBalance: 0,
        net: 0,
      }
    );

    if (!hasDraftData) return baseTotals;

    return {
      openingBalance: baseTotals.openingBalance + openingBalance,
      cashSale: baseTotals.cashSale + formData.cashSale,
      upi: baseTotals.upi + formData.upi,
      creditCard: baseTotals.creditCard + formData.creditCard,
      creditNote: baseTotals.creditNote + formData.creditNote,
      deposited: baseTotals.deposited + formData.deposited,
      qty: baseTotals.qty + formData.qty,
      totalSale: baseTotals.totalSale + totalSale,
      expense: baseTotals.expense + formData.expense,
      closingBalance: baseTotals.closingBalance + closingBalance,
      net: baseTotals.net + net,
    };
  };

  const totals = calculateTotals();

  const downloadExcel = () => {
    // Prepare data for Excel
    const excelData = reports.map((report) => ({
      Date: new Date(report.date).toLocaleDateString("en-GB"),
      "Opening Balance": (report.openingBalance || 0).toFixed(2),
      "Cash Sale": (report.cashSale || 0).toFixed(2),
      UPI: (report.upi || 0).toFixed(2),
      "Credit Card": (report.creditCard || 0).toFixed(2),
      "Credit Note": (report.creditNote || 0).toFixed(2),
      Deposited: (report.deposited || 0).toFixed(2),
      Qty: report.qty || 0,
      Note: report.note || "-",
      "Total Sale": (report.totalSale || 0).toFixed(2),
      Expense: (report.expense || 0).toFixed(2),
      "Closing Balance": (report.closingBalance || 0).toFixed(2),
      Net: (report.net || 0).toFixed(2),
    }));

    // Add totals row if available
    if (totals && !hasDraftData) {
      excelData.push({
        Date: "Total",
        "Opening Balance": totals.openingBalance.toFixed(2),
        "Cash Sale": totals.cashSale.toFixed(2),
        UPI: totals.upi.toFixed(2),
        "Credit Card": totals.creditCard.toFixed(2),
        "Credit Note": totals.creditNote.toFixed(2),
        Deposited: totals.deposited.toFixed(2),
        Qty: totals.qty,
        Note: "-",
        "Total Sale": totals.totalSale.toFixed(2),
        Expense: totals.expense.toFixed(2),
        "Closing Balance": totals.closingBalance.toFixed(2),
        Net: totals.net.toFixed(2),
      });
    }

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 12 }, // Date
      { wch: 15 }, // Opening Balance
      { wch: 12 }, // Cash Sale
      { wch: 12 }, // UPI
      { wch: 12 }, // Credit Card
      { wch: 12 }, // Credit Note
      { wch: 12 }, // Deposited
      { wch: 8 },  // Qty
      { wch: 25 }, // Note
      { wch: 12 }, // Total Sale
      { wch: 12 }, // Expense
      { wch: 15 }, // Closing Balance
      { wch: 12 }, // Net
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Reports");

    // Generate file name with current date
    const fileName = `Daily_Reports_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Daily Report</h1>
          <p className="text-slate-600">Track your daily sales, expenses, and performance metrics</p>
        </div>

        {/* Add Daily Report Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Add Daily Report</h2>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent"
                  required
                />
              </div>

              {/* Opening Balance */}
              <div>
                <label htmlFor="openingBalance" className="block text-sm font-medium text-slate-700 mb-2">
                  Opening Balance {isFirstEntry && <span className="text-blue-600">(Editable - First Entry)</span>}
                </label>
                <input
                  type="number"
                  id="openingBalance"
                  name="openingBalance"
                  value={isFirstEntry ? formData.openingBalance : openingBalance.toFixed(2)}
                  onChange={handleInputChange}
                  onFocus={(e) => isFirstEntry && e.target.select()}
                  readOnly={!isFirstEntry}
                  step="0.01"
                  className={`w-full px-4 py-2.5 text-black border border-slate-200 rounded-lg ${
                    isFirstEntry 
                      ? 'bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                      : 'bg-slate-100 text-slate-600 cursor-not-allowed'
                  }`}
                  placeholder="0.00"
                />
              </div>

              {/* Cash Sale */}
              <div>
                <label htmlFor="cashSale" className="block text-sm font-medium text-slate-700 mb-2">
                  Cash Sale
                </label>
                <input
                  type="number"
                  id="cashSale"
                  name="cashSale"
                //   value={formData.cashSale}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2.5 bg-slate-50 text-black border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* UPI */}
              <div>
                <label htmlFor="upi" className="block text-sm font-medium text-slate-700 mb-2">
                  UPI
                </label>
                <input
                  type="number"
                  id="upi"
                  name="upi"
                //   value={formData.upi}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2.5 bg-slate-50 text-black border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Credit Card */}
              <div>
                <label htmlFor="creditCard" className="block text-sm font-medium text-slate-700 mb-2">
                  Credit Card
                </label>
                <input
                  type="number"
                  id="creditCard"
                  name="creditCard"
                //   value={formData.creditCard}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2.5 bg-slate-50 text-black border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Credit Note */}
              <div>
                <label htmlFor="creditNote" className="block text-sm font-medium text-slate-700 mb-2">
                  Credit Note
                </label>
                <input
                  type="number"
                  id="creditNote"
                  name="creditNote"
                //   value={formData.creditNote}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2.5 bg-slate-50 text-black border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Deposited */}
              <div>
                <label htmlFor="deposited" className="block text-sm font-medium text-slate-700 mb-2">
                  Deposited
                </label>
                <input
                  type="number"
                  id="deposited"
                  name="deposited"
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2.5 bg-slate-50 text-black border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Qty */}
              <div>
                <label htmlFor="qty" className="block text-sm font-medium text-slate-700 mb-2">
                  Qty
                </label>
                <input
                  type="number"
                  id="qty"
                  name="qty"
                  onChange={handleInputChange}
                  step="1"
                  className="w-full px-4 py-2.5 bg-slate-50 text-black border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              {/* Note */}
              <div>
                <label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-2">
                  Note
                </label>
                <input
                  type="text"
                  id="note"
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-50 text-black border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a note"
                />
              </div>

              {/* Total Sale (Auto-calculated) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Total Sale (Auto-calculated)
                </label>
                <input
                  type="number"
                  value={totalSale.toFixed(2)}
                  readOnly
                  className="w-full px-4 py-2.5 bg-slate-100 text-black border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
                  placeholder="0.00"
                />
              </div>

              {/* Closing Balance */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Closing Balance (Auto-calculated)
                </label>
                <input
                  type="number"
                  value={closingBalance.toFixed(2)}
                  readOnly
                  className="w-full px-4 py-2.5 bg-slate-100 text-black border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
                  placeholder="0.00"
                />
              </div>

              {/* Expense */}
              <div>
                <label htmlFor="expense" className="block text-sm font-medium text-slate-700 mb-2">
                  Expense
                </label>
                <input
                  type="number"
                  id="expense"
                  name="expense"
                //   value={formData.expense}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2.5 bg-slate-50 text-black border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Net (Auto-calculated) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Net (Auto-calculated)
                </label>
                <input
                  type="number"
                  value={net.toFixed(2)}
                  readOnly
                  className="w-full px-4 py-2.5 bg-slate-100 text-black border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 focus:ring-4 focus:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Saving..." : "Save Report"}
              </button>
            </div>
          </form>
        </div>

        {/* Balance Sheet */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">Records</h2>
              <p className="text-sm text-slate-600 mt-1">
                {reports.length === 0 ? "No records available" : `${reports.length} record${reports.length !== 1 ? "s" : ""} loaded`}
              </p>
            </div>
            {reports.length > 0 && (
              <button
                onClick={downloadExcel}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 focus:ring-4 focus:ring-slate-300 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download Excel
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Opening Balance</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Cash Sale</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">UPI</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Credit Card</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Credit Note</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Deposited</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Qty</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Note</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Total Sale</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Expense</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Closing Balance</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Net</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(report.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{(report.openingBalance || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{(report.cashSale || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{(report.upi || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{(report.creditCard || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{(report.creditNote || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{(report.deposited || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      {report.qty || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {report.note || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">
                      ₹{(report.totalSale || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 text-right">
                      ₹{(report.expense || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">
                      ₹{(report.closingBalance || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">
                      ₹{(report.net || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {totals && (
                  <tr className="bg-slate-100 font-semibold border-t-2 border-slate-300">
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {hasDraftData ? "Total (incl. draft)" : "Total"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{totals.openingBalance.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{totals.cashSale.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{totals.upi.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{totals.creditCard.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{totals.creditNote.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{totals.deposited.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      {totals.qty}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      -
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{totals.totalSale.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 text-right">
                      ₹{totals.expense.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{totals.closingBalance.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 text-right">
                      ₹{totals.net.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {reports.length === 0 && (
              <div className="text-center py-8 text-slate-500">No reports available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
