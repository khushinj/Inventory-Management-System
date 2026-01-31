import dailyReportService from '../services/dailyReport.service.js';

// Create or update daily report
export const saveDailyReport = async (req, res) => {
  try {
    const report = await dailyReportService.saveReport(req.body);
    
    res.status(report.isNew === false ? 200 : 201).json({
      message: report.isNew === false ? 'Daily report updated successfully' : 'Daily report created successfully',
      data: report,
    });
  } catch (error) {
    console.error('Error saving daily report:', error);
    res.status(500).json({
      message: 'Error saving daily report',
      error: error.message,
    });
  }
};

// Get all daily reports
export const getAllDailyReports = async (req, res) => {
  try {
    const reports = await dailyReportService.getAllReports();
    res.status(200).json({
      message: 'Daily reports fetched successfully',
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    res.status(500).json({
      message: 'Error fetching daily reports',
      error: error.message,
    });
  }
};

// Get daily report by date
export const getDailyReportByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const report = await dailyReportService.getReportByDate(date);

    if (!report) {
      return res.status(404).json({
        message: 'Daily report not found for this date',
      });
    }

    res.status(200).json({
      message: 'Daily report fetched successfully',
      data: report,
    });
  } catch (error) {
    console.error('Error fetching daily report:', error);
    res.status(500).json({
      message: 'Error fetching daily report',
      error: error.message,
    });
  }
};

// Delete daily report
export const deleteDailyReport = async (req, res) => {
  try {
    const { date } = req.params;
    const report = await dailyReportService.deleteReport(date);

    if (!report) {
      return res.status(404).json({
        message: 'Daily report not found for this date',
      });
    }

    res.status(200).json({
      message: 'Daily report deleted successfully',
      data: report,
    });
  } catch (error) {
    console.error('Error deleting daily report:', error);
    res.status(500).json({
      message: 'Error deleting daily report',
      error: error.message,
    });
  }
};

// Get reports by date range
export const getReportsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const reports = await dailyReportService.getReportsByDateRange(startDate, endDate);

    res.status(200).json({
      message: 'Daily reports fetched successfully',
      count: reports.length,
      dateRange: { startDate, endDate },
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching reports by date range:', error);
    res.status(500).json({
      message: 'Error fetching reports by date range',
      error: error.message,
    });
  }
};

// Get reports by month
export const getReportsByMonth = async (req, res) => {
  try {
    const { year, month } = req.params;
    const reports = await dailyReportService.getReportsByMonth(year, month);

    res.status(200).json({
      message: 'Monthly reports fetched successfully',
      count: reports.length,
      month: { year, month },
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching monthly reports:', error);
    res.status(500).json({
      message: 'Error fetching monthly reports',
      error: error.message,
    });
  }
};

// Get summary statistics
export const getSummaryStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await dailyReportService.getSummaryStats(startDate, endDate);

    res.status(200).json({
      message: 'Summary statistics fetched successfully',
      dateRange: { startDate, endDate },
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching summary statistics:', error);
    res.status(500).json({
      message: 'Error fetching summary statistics',
      error: error.message,
    });
  }
};
