import express from 'express';
import {
  saveOnlineDailyReport,
  getAllOnlineDailyReports,
  getOnlineDailyReportByDate,
  deleteOnlineDailyReport,
  getOnlineReportsByDateRange,
  getOnlineReportsByMonth,
  getOnlineSummaryStats,
} from '../controllers/onlineDailyReport.controller.js';
import {
  validateDailyReport,
  validateDateParam,
  validateDateRange,
  validateMonthYear,
} from '../middleware/validateDailyReport.js';

const router = express.Router();

// POST - Create or update online daily report
router.post('/', validateDailyReport, saveOnlineDailyReport);

// GET - Get summary statistics for a date range (must be before /:date)
router.get('/summary', validateDateRange, getOnlineSummaryStats);

// GET - Get online reports by date range (must be before /:date)
router.get('/range', validateDateRange, getOnlineReportsByDateRange);

// GET - Get online reports by month (must be before /:date)
router.get('/month/:year/:month', validateMonthYear, getOnlineReportsByMonth);

// GET - Get all online daily reports
router.get('/', getAllOnlineDailyReports);

// GET - Get online daily report by date (must be last)
router.get('/:date', validateDateParam, getOnlineDailyReportByDate);

// DELETE - Delete online daily report by date
router.delete('/:date', validateDateParam, deleteOnlineDailyReport);

export default router;
