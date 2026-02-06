import DailyReport from '../models/DailyReport.js';

class DailyReportService {
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
    const net = this.calculateNet(totalSale, expense);
    const closingBalance = (cashSale || 0) - (expense || 0) - (deposited || 0);

    const previousReport = await DailyReport.findOne({ date: { $lt: reportDate } })
      .sort({ date: -1 })
      .select('net');
    // Use custom opening balance only if this is the first report (no previous reports)
    const openingBalance = previousReport ? previousReport.net : (customOpeningBalance || 0);

    // Check if report exists for this date
    const existingReport = await DailyReport.findOne({ date: reportDate });

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
    const newReport = new DailyReport({
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
    return await DailyReport.find().sort({ date: -1 });
  }

  // Get report by date
  async getReportByDate(date) {
    const reportDate = this.normalizeDate(date);
    return await DailyReport.findOne({ date: reportDate });
  }

  // Get reports within date range
  async getReportsByDateRange(startDate, endDate) {
    const start = this.normalizeDate(startDate);
    const end = this.normalizeDate(endDate);
    end.setHours(23, 59, 59, 999); // Include entire end date

    return await DailyReport.find({
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

    return await DailyReport.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ date: -1 });
  }

  // Delete report by date
  async deleteReport(date) {
    const reportDate = this.normalizeDate(date);
    return await DailyReport.findOneAndDelete({ date: reportDate });
  }

  // Get summary statistics for a date range
  async getSummaryStats(startDate, endDate) {
    const start = this.normalizeDate(startDate);
    const end = this.normalizeDate(endDate);
    end.setHours(23, 59, 59, 999);

    const reports = await DailyReport.find({
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
        averageDailySale: 0,
        averageDailyExpense: 0,
        averageDailyNet: 0,
      };
    }

    const summary = reports.reduce(
      (acc, report) => ({
        totalOpeningBalance: acc.totalOpeningBalance + report.openingBalance,
        totalCashSale: acc.totalCashSale + report.cashSale,
        totalUPI: acc.totalUPI + report.upi,
        totalCreditCard: acc.totalCreditCard + report.creditCard,
        totalCreditNote: acc.totalCreditNote + report.creditNote,
        totalDeposited: acc.totalDeposited + report.deposited,
        totalSale: acc.totalSale + report.totalSale,
        totalExpense: acc.totalExpense + report.expense,
        totalClosingBalance: acc.totalClosingBalance + report.closingBalance,
        totalNet: acc.totalNet + report.net,
      }),
      {
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
      }
    );

    return {
      totalReports: reports.length,
      ...summary,
      averageDailySale: summary.totalSale / reports.length,
      averageDailyExpense: summary.totalExpense / reports.length,
      averageDailyNet: summary.totalNet / reports.length,
    };
  }

  // Check if report exists for a date
  async reportExists(date) {
    const reportDate = this.normalizeDate(date);
    const count = await DailyReport.countDocuments({ date: reportDate });
    return count > 0;
  }
}

export default new DailyReportService();
