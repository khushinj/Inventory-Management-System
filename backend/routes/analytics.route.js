import express from "express";
import {
  getSummary,
  getTimeSeries,
  getDistribution,
  getTopProductsController,
  getDashboard,
  getRecentActivity,
  getExportFobAnalytics,
} from "../controllers/analytics.controller.js";

const router = express.Router();

/**
 * Analytics Routes
 * All routes return data based on specified time period (days query param)
 */

// GET /api/analytics/dashboard - Get all analytics data in one call
router.get("/dashboard", getDashboard);

// GET /api/analytics/summary - Get summary metrics
router.get("/summary", getSummary);

// GET /api/analytics/timeseries - Get time-series chart data
router.get("/timeseries", getTimeSeries);

// GET /api/analytics/distribution - Get category distribution
router.get("/distribution", getDistribution);

// GET /api/analytics/top-products - Get top performing products
router.get("/top-products", getTopProductsController);

// GET /api/analytics/recent-activity - Unified recent feed across all areas
router.get("/recent-activity", getRecentActivity);

// GET /api/analytics/export-fob - Combined export-fob data with status information
router.get("/export-fob", getExportFobAnalytics);

export default router;
