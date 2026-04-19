import {
  getAnalyticsSummary,
  getTimeSeriesData,
  getCategoryDistribution,
  getTopProducts,
  getRecentActivityFeed,
} from "../services/analytics.service.js";
import ProductionTracking from "../models/ProductionTracking.js";
import PresentStock from "../models/PresentStock.js";

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
 * Get unified activity feed across shop, domestic, online, and jobcard areas
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

/**
 * GET /api/analytics/export-fob
 * Get production-based export-fob data flattened by stage quantity
 */
export const getExportFobAnalytics = async (req, res) => {
  try {
    const status = req.query.status; // Optional: filter by status

    const [productionTracking, presentStocks] = await Promise.all([
      ProductionTracking.find().sort({ createdAt: -1 }).lean(),
      PresentStock.find().sort({ createdAt: -1 }).lean(),
    ]);

    const stageMeta = [
      { status: "In Cutting", qtyKey: "cutting" },
      { status: "In Stitching", qtyKey: "stitching" },
      { status: "In Finishing", qtyKey: "finishing" },
    ];

    const productionRows = productionTracking.flatMap((item) =>
      stageMeta
        .map((stage) => ({
          ...stage,
          qty: Number(item[stage.qtyKey] || 0),
        }))
        .filter((stage) => stage.qty > 0)
        .map((stage) => ({
          _id: `${item._id}-${stage.status}`,
          sourceId: item._id,
          type: "production-tracking",
          designNumber: item.designNumber,
          status: stage.status,
          qty: stage.qty,
          color: item.color,
          size: item.size,
          remarks: item.remarks,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }))
    );

    const presentStockRows = presentStocks.map((item) => ({
      _id: `${item._id}-${item.status}`,
      sourceId: item._id,
      type: "present-stock",
      designNumber: item.duo,
      status: item.status,
      qty: 1,
      color: item.color,
      size: item.size,
      remarks: null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    const allData = [...productionRows, ...presentStockRows];

    const filteredData = status ? allData.filter((item) => item.status === status) : allData;

    const statusCounts = {
      "In Cutting": allData.filter((item) => item.status === "In Cutting").reduce((sum, item) => sum + item.qty, 0),
      "In Stitching": allData.filter((item) => item.status === "In Stitching").reduce((sum, item) => sum + item.qty, 0),
      "In Finishing": allData.filter((item) => item.status === "In Finishing").reduce((sum, item) => sum + item.qty, 0),
      Packed: allData.filter((item) => item.status === "Packed").reduce((sum, item) => sum + item.qty, 0),
      Shipped: allData.filter((item) => item.status === "Shipped").reduce((sum, item) => sum + item.qty, 0),
    };

    res.status(200).json({
      success: true,
      data: {
        items: filteredData,
        statusCounts,
        totalItems: allData.reduce((sum, item) => sum + item.qty, 0),
        filteredCount: filteredData.reduce((sum, item) => sum + item.qty, 0),
        totalRecords: allData.length,
        filteredRecords: filteredData.length,
        selectedStatus: status || null,
      },
    });
  } catch (error) {
    console.error("Error in getExportFobAnalytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch export-fob analytics",
      error: error.message,
    });
  }
};
