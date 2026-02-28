import express from 'express';
import { normalizeDesignNumberAll } from '../middleware/normalizeDesignNumber.js';
import {
  saveDailyReport,
  getAllDailyReports,
  getDailyReportByDate,
  deleteDailyReport,
  getReportsByDateRange,
  getReportsByMonth,
  getSummaryStats,
} from '../controllers/dailyReport.controller.js';
import {
  validateDailyReport,
  validateDateParam,
  validateDateRange,
  validateMonthYear,
} from '../middleware/validateDailyReport.js';

const router = express.Router();

// Apply normalization middleware to all routes
router.use(normalizeDesignNumberAll);

// POST - Create or update daily report
router.post('/', validateDailyReport, saveDailyReport);

// GET - Get summary statistics for a date range (must be before /:date)
router.get('/summary', validateDateRange, getSummaryStats);

// GET - Get reports by date range (must be before /:date)
router.get('/range', validateDateRange, getReportsByDateRange);

// GET - Get reports by month (must be before /:date)
router.get('/month/:year/:month', validateMonthYear, getReportsByMonth);

// GET - Get all daily reports
router.get('/', getAllDailyReports);

// GET - Get daily report by date (must be last)
router.get('/:date', validateDateParam, getDailyReportByDate);

// DELETE - Delete daily report by date
router.delete('/:date', validateDateParam, deleteDailyReport);

export default router;
