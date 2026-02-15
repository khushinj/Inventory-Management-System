import OnlineDailyReport from '../models/OnlineDailyReport.js';

class OnlineDailyReportService {
  // Normalize date to start of day (00:00:00)
  normalizeDate(date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  // Calculate total sale
  calculateTotalSale(cashSale, upi, creditCard, creditNote) {
    return (cashSale || 0) + (upi || 0) + (creditCard || 0) + (creditNote || 0);
  }

  // Calculate net amount
  calculateNet(totalSale, expense) {
    return (totalSale || 0) - (expense || 0);
  }

  // Create or update daily report
  async saveReport(reportData) {
    const { date, cashSale, upi, creditCard, creditNote, expense, qty, note, deposited, openingBalance: customOpeningBalance } = reportData;

    // Normalize date
    const reportDate = this.normalizeDate(date);

    // Calculate totals
    const totalSale = this.calculateTotalSale(cashSale, upi, creditCard, creditNote);
    
    const previousReport = await OnlineDailyReport.findOne({ date: { $lt: reportDate } })
      .sort({ date: -1 })
      .select('closingBalance');
    // Use custom opening balance only if this is the first report (no previous reports)
    const openingBalance = previousReport ? previousReport.closingBalance : (customOpeningBalance || 0);
    
    const closingBalance = openingBalance + (cashSale || 0) - (expense || 0) - (deposited || 0);
    const net = openingBalance + totalSale - (expense || 0) - (deposited || 0);

    // Check if report exists for this date
    const existingReport = await OnlineDailyReport.findOne({ date: reportDate });

    if (existingReport) {
      // Update existing report
      existingReport.openingBalance = openingBalance;
      existingReport.cashSale = cashSale || 0;
      existingReport.upi = upi || 0;
      existingReport.creditCard = creditCard || 0;
      existingReport.creditNote = creditNote || 0;
      existingReport.qty = qty || 0;
      existingReport.note = note || '';
      existingReport.deposited = deposited || 0;
      existingReport.expense = expense || 0;
      existingReport.totalSale = totalSale;
      existingReport.closingBalance = closingBalance;
      existingReport.net = net;

      return await existingReport.save();
    }

    // Create new report
    const newReport = new OnlineDailyReport({
      date: reportDate,
      openingBalance,
      cashSale: cashSale || 0,
      upi: upi || 0,
      creditCard: creditCard || 0,
      creditNote: creditNote || 0,
      qty: qty || 0,
      note: note || '',
      deposited: deposited || 0,
      expense: expense || 0,
      totalSale,
      closingBalance,
      net,
    });

    return await newReport.save();
  }

  // Get all reports sorted by date (newest first)
  async getAllReports() {
    return await OnlineDailyReport.find().sort({ date: -1 });
  }

  // Get report by date
  async getReportByDate(date) {
    const reportDate = this.normalizeDate(date);
    return await OnlineDailyReport.findOne({ date: reportDate });
  }

  // Get reports within date range
  async getReportsByDateRange(startDate, endDate) {
    const start = this.normalizeDate(startDate);
    const end = this.normalizeDate(endDate);
    end.setHours(23, 59, 59, 999); // Include entire end date

    return await OnlineDailyReport.find({
      date: {
        $gte: start,
        $lte: end,
      },
    }).sort({ date: -1 });
  }

  // Get reports for a specific month
  async getReportsByMonth(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    return await OnlineDailyReport.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ date: -1 });
  }

  // Delete report by date
  async deleteReport(date) {
    const reportDate = this.normalizeDate(date);
    return await OnlineDailyReport.findOneAndDelete({ date: reportDate });
  }

  // Get summary statistics for a date range
  async getSummaryStats(startDate, endDate) {
    const start = this.normalizeDate(startDate);
    const end = this.normalizeDate(endDate);
    end.setHours(23, 59, 59, 999);

    const reports = await OnlineDailyReport.find({
      date: {
        $gte: start,
        $lte: end,
      },
    });

    if (reports.length === 0) {
      return {
        totalReports: 0,
        totalOpeningBalance: 0,
        totalCashSale: 0,
        totalUPI: 0,
        totalCreditCard: 0,
        totalCreditNote: 0,
        totalDeposited: 0,
        totalSale: 0,
        totalExpense: 0,
        totalClosingBalance: 0,
        totalNet: 0,
        avgDailySale: 0,
        avgDailyExpense: 0,
        avgNet: 0,
      };
    }

    const summary = reports.reduce((acc, report) => {
      acc.totalOpeningBalance += report.openingBalance || 0;
      acc.totalCashSale += report.cashSale || 0;
      acc.totalUPI += report.upi || 0;
      acc.totalCreditCard += report.creditCard || 0;
      acc.totalCreditNote += report.creditNote || 0;
      acc.totalDeposited += report.deposited || 0;
      acc.totalSale += report.totalSale || 0;
      acc.totalExpense += report.expense || 0;
      acc.totalClosingBalance += report.closingBalance || 0;
      acc.totalNet += report.net || 0;
      return acc;
    }, {
      totalOpeningBalance: 0,
      totalCashSale: 0,
      totalUPI: 0,
      totalCreditCard: 0,
      totalCreditNote: 0,
      totalDeposited: 0,
      totalSale: 0,
      totalExpense: 0,
      totalClosingBalance: 0,
      totalNet: 0,
    });

    const count = reports.length;
    summary.totalReports = count;
    summary.avgDailySale = summary.totalSale / count;
    summary.avgDailyExpense = summary.totalExpense / count;
    summary.avgNet = summary.totalNet / count;

    return summary;
  }

  // Get the latest report
  async getLatestReport() {
    return await OnlineDailyReport.findOne().sort({ date: -1 });
  }
}

export default new OnlineDailyReportService();
