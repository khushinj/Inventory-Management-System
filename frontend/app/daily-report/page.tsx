"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api";

interface DailyReport {
  _id: string;
  date: string;
  cashInHand: number;
  cashSale: number;
  upi: number;
  creditCard: number;
  creditNote: number;
  totalSale: number;
  expense: number;
  net: number;
}

export default function DailyReportPage() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    cashInHand: 0,
    cashSale: 0,
    upi: 0,
    creditCard: 0,
    creditNote: 0,
    expense: 0,
  });

  const [reports, setReports] = useState<DailyReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Calculate total sale
  const totalSale = formData.cashSale + formData.upi + formData.creditCard + formData.creditNote;

  // Fetch all reports
  const fetchReports = async () => {
    try {
      const response = await api.get("/daily-report");
      setReports(response.data.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "date" ? value : parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await api.post("/daily-report", formData);
      
      setMessage({ type: "success", text: response.data.message });
      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        cashInHand: 0,
        cashSale: 0,
        upi: 0,
        creditCard: 0,
        creditNote: 0,
        expense: 0,
      });
      // Refresh reports
      fetchReports();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Network error. Please try again.";
      setMessage({ type: "error", text: errorMessage });
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals for balance sheet
  const calculateTotals = () => {
    if (reports.length === 0) return null;

    return reports.reduce(
      (acc, report) => ({
        cashInHand: acc.cashInHand + report.cashInHand,
        cashSale: acc.cashSale + report.cashSale,
        upi: acc.upi + report.upi,
        creditCard: acc.creditCard + report.creditCard,
        creditNote: acc.creditNote + report.creditNote,
        totalSale: acc.totalSale + report.totalSale,
        expense: acc.expense + report.expense,
        net: acc.net + report.net,
      }),
      {
        cashInHand: 0,
        cashSale: 0,
        upi: 0,
        creditCard: 0,
        creditNote: 0,
        totalSale: 0,
        expense: 0,
        net: 0,
      }
    );
  };

  const totals = calculateTotals();

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

              {/* Today Cash in Hand */}
              <div>
                <label htmlFor="cashInHand" className="block text-sm font-medium text-slate-700 mb-2">
                  Today Cash in Hand
                </label>
                <input
                  type="number"
                  id="cashInHand"
                  name="cashInHand"
                //   value={formData.cashInHand}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2.5 bg-slate-50 text-black border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Records</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Cash in Hand</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Cash Sale</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">UPI</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Credit Card</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Credit Note</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Total Sale</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Expense</th>
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
                      ₹{report.cashInHand.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{report.cashSale.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{report.upi.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{report.creditCard.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{report.creditNote.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">
                      ₹{report.totalSale.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 text-right">
                      ₹{report.expense.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">
                      ₹{report.net.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {totals && (
                  <tr className="bg-slate-100 font-semibold border-t-2 border-slate-300">
                    <td className="px-4 py-3 text-sm text-slate-900">Total</td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      ₹{totals.cashInHand.toFixed(2)}
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
                      ₹{totals.totalSale.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 text-right">
                      ₹{totals.expense.toFixed(2)}
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
