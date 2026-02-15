import onlineDailyReportService from '../services/onlineDailyReport.service.js';

// Create or update online daily report
export const saveOnlineDailyReport = async (req, res) => {
  try {
    const report = await onlineDailyReportService.saveReport(req.body);
    
    res.status(report.isNew === false ? 200 : 201).json({
      message: report.isNew === false ? 'Online daily report updated successfully' : 'Online daily report created successfully',
      data: report,
    });
  } catch (error) {
    console.error('Error saving online daily report:', error);
    res.status(500).json({
      message: 'Error saving online daily report',
      error: error.message,
    });
  }
};

// Get all online daily reports
export const getAllOnlineDailyReports = async (req, res) => {
  try {
    const reports = await onlineDailyReportService.getAllReports();
    res.status(200).json({
      message: 'Online daily reports fetched successfully',
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching online daily reports:', error);
    res.status(500).json({
      message: 'Error fetching online daily reports',
      error: error.message,
    });
  }
};

// Get online daily report by date
export const getOnlineDailyReportByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const report = await onlineDailyReportService.getReportByDate(date);

    if (!report) {
      return res.status(404).json({
        message: 'Online daily report not found for this date',
      });
    }

    res.status(200).json({
      message: 'Online daily report fetched successfully',
      data: report,
    });
  } catch (error) {
    console.error('Error fetching online daily report:', error);
    res.status(500).json({
      message: 'Error fetching online daily report',
      error: error.message,
    });
  }
};

// Delete online daily report
export const deleteOnlineDailyReport = async (req, res) => {
  try {
    const { date } = req.params;
    const report = await onlineDailyReportService.deleteReport(date);

    if (!report) {
      return res.status(404).json({
        message: 'Online daily report not found for this date',
      });
    }

    res.status(200).json({
      message: 'Online daily report deleted successfully',
      data: report,
    });
  } catch (error) {
    console.error('Error deleting online daily report:', error);
    res.status(500).json({
      message: 'Error deleting online daily report',
      error: error.message,
    });
  }
};

// Get online reports by date range
export const getOnlineReportsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const reports = await onlineDailyReportService.getReportsByDateRange(startDate, endDate);

    res.status(200).json({
      message: 'Online daily reports fetched successfully',
      count: reports.length,
      dateRange: { startDate, endDate },
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching online reports by date range:', error);
    res.status(500).json({
      message: 'Error fetching online reports by date range',
      error: error.message,
    });
  }
};

// Get online reports by month
export const getOnlineReportsByMonth = async (req, res) => {
  try {
    const { year, month } = req.params;
    const reports = await onlineDailyReportService.getReportsByMonth(parseInt(year), parseInt(month));

    res.status(200).json({
      message: 'Online daily reports for the month fetched successfully',
      count: reports.length,
      month: `${year}-${month}`,
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching online reports by month:', error);
    res.status(500).json({
      message: 'Error fetching online reports by month',
      error: error.message,
    });
  }
};

// Get summary statistics for online reports
export const getOnlineSummaryStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await onlineDailyReportService.getSummaryStats(startDate, endDate);

    res.status(200).json({
      message: 'Online summary statistics fetched successfully',
      dateRange: { startDate, endDate },
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching online summary stats:', error);
    res.status(500).json({
      message: 'Error fetching online summary statistics',
      error: error.message,
    });
  }
};
