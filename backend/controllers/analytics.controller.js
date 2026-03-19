import {
  getAnalyticsSummary,
  getTimeSeriesData,
  getCategoryDistribution,
  getTopProducts,
  getRecentActivityFeed,
} from "../services/analytics.service.js";

/**
 * GET /api/analytics/summary
 * Get analytics summary metrics
 */
export const getSummary = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    const summary = await getAnalyticsSummary(days);
    
    res.status(200).json({
      success: true,
      data: summary,
      period: `${days} days`,
    });
  } catch (error) {
    console.error("Error in getSummary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics summary",
      error: error.message,
    });
  }
};

/**
 * GET /api/analytics/timeseries
 * Get time-series data for charts
 */
export const getTimeSeries = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const interval = req.query.interval || 'day';
    
    // Determine interval based on days if not specified
    let actualInterval = interval;
    if (days <= 7) {
      actualInterval = 'day';
    } else if (days <= 30) {
      actualInterval = 'day';
    } else if (days <= 90) {
      actualInterval = 'week';
    } else {
      actualInterval = 'month';
    }
    
    const data = await getTimeSeriesData(days, actualInterval);
    
    res.status(200).json({
      success: true,
      data,
      period: `${days} days`,
      interval: actualInterval,
    });
  } catch (error) {
    console.error("Error in getTimeSeries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch time-series data",
      error: error.message,
    });
  }
};

/**
 * GET /api/analytics/distribution
 * Get category/channel distribution
 */
export const getDistribution = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    const distribution = await getCategoryDistribution(days);
    
    res.status(200).json({
      success: true,
      data: distribution,
      period: `${days} days`,
    });
  } catch (error) {
    console.error("Error in getDistribution:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch distribution data",
      error: error.message,
    });
  }
};

/**
 * GET /api/analytics/top-products
 * Get top performing products
 */
export const getTopProductsController = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const limit = parseInt(req.query.limit) || 10;
    
    const products = await getTopProducts(days, limit);
    
    res.status(200).json({
      success: true,
      data: products,
      period: `${days} days`,
    });
  } catch (error) {
    console.error("Error in getTopProducts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top products",
      error: error.message,
    });
  }
};

/**
 * GET /api/analytics/dashboard
 * Get all analytics data in one call
 */
export const getDashboard = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    const [summary, timeSeries, distribution, topProducts] = await Promise.all([
      getAnalyticsSummary(days),
      getTimeSeriesData(days, days <= 30 ? 'day' : days <= 90 ? 'week' : 'month'),
      getCategoryDistribution(days),
      getTopProducts(days, 5),
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        summary,
        timeSeries,
        distribution,
        topProducts,
      },
      period: `${days} days`,
    });
  } catch (error) {
    console.error("Error in getDashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
};

/**
 * GET /api/analytics/recent-activity
 * Get unified activity feed across shop, domestic, and online areas
 */
export const getRecentActivity = async (req, res) => {
  try {
    const hours = parseInt(req.query.hours, 10) || 24;
    const parsedLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined;

    const feed = await getRecentActivityFeed(hours, limit);

    res.status(200).json({
      success: true,
      data: feed,
      period: `${hours} hours`,
    });
  } catch (error) {
    console.error("Error in getRecentActivity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent activity",
      error: error.message,
    });
  }
};
