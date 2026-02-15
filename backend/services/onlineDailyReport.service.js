import OnlineDailyReport from '../models/OnlineDailyReport.js';

class OnlineDailyReportService {
  // Normalize date to start of day (00:00:00)
  normalizeDate(date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  // Create or update daily report
  async saveReport(reportData) {
    const { 
      date, 
      myntraQty, ajioQty, amazonQty, flipkartQty, snapdealQty, websiteQty,
      myntraPrice, ajioPrice, amazonPrice, flipkartPrice, snapdealPrice, websitePrice,
      totalReturns, amountReceived 
    } = reportData;

    console.log('📥 Service received data:', reportData);

    // Normalize date
    const reportDate = this.normalizeDate(date);

    // Check if report exists for this date
    const existingReport = await OnlineDailyReport.findOne({ date: reportDate });

    if (existingReport) {
      // Update existing report
      existingReport.myntraQty = myntraQty || 0;
      existingReport.ajioQty = ajioQty || 0;
      existingReport.amazonQty = amazonQty || 0;
      existingReport.flipkartQty = flipkartQty || 0;
      existingReport.snapdealQty = snapdealQty || 0;
      existingReport.websiteQty = websiteQty || 0;
      existingReport.myntraPrice = myntraPrice || 0;
      existingReport.ajioPrice = ajioPrice || 0;
      existingReport.amazonPrice = amazonPrice || 0;
      existingReport.flipkartPrice = flipkartPrice || 0;
      existingReport.snapdealPrice = snapdealPrice || 0;
      existingReport.websitePrice = websitePrice || 0;
      existingReport.totalReturns = totalReturns || 0;
      existingReport.amountReceived = amountReceived || 0;

      const savedReport = await existingReport.save();
      console.log('✅ Report updated:', savedReport);
      return savedReport;
    }

    // Create new report
    const newReport = new OnlineDailyReport({
      date: reportDate,
      myntraQty: myntraQty || 0,
      ajioQty: ajioQty || 0,
      amazonQty: amazonQty || 0,
      flipkartQty: flipkartQty || 0,
      snapdealQty: snapdealQty || 0,
      websiteQty: websiteQty || 0,
      myntraPrice: myntraPrice || 0,
      ajioPrice: ajioPrice || 0,
      amazonPrice: amazonPrice || 0,
      flipkartPrice: flipkartPrice || 0,
      snapdealPrice: snapdealPrice || 0,
      websitePrice: websitePrice || 0,
      totalReturns: totalReturns || 0,
      amountReceived: amountReceived || 0,
    });

    const savedReport = await newReport.save();
    console.log('✅ Report created:', savedReport);
    return savedReport;
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
