import { getTransactionModel } from "../models/Transaction.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import StockReturned from "../models/StockReturned.js";
import DailyReport from "../models/DailyReport.js";
import OnlineDailyReport from "../models/OnlineDailyReport.js";
import JobCard from "../models/JobCard.js";
import { getWarehouseInventorySummary } from "./warehouseInventory.service.js";

const SHOP_FORMS = ["import", "sales", "return", "purchase"];
const DOMESTIC_FORMS = [
  "dispatch",
  "production",
  "purchase",
  "transfer",
  "transfer inwards",
  "transfer outwards",
  "return",
  "sample",
  "sales",
];
const ONLINE_FORMS = ["return", "sales", "transfer", "purchase", "transfer inwards", "transfer outwards"];

const toTimestamp = (value) => {
  const dt = value ? new Date(value) : null;
  return dt && !Number.isNaN(dt.getTime()) ? dt.toISOString() : null;
};

const normalizeKeyPart = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");

const normalizeTxn = (entry, area, source) => ({
  id: String(entry._id),
  area,
  source,
  activityType: entry.formType || source,
  date: toTimestamp(entry.date),
  activityAt: toTimestamp(entry.createdAt || entry.date),
  designNumber: entry.dno || null,
  quantity: Number(entry.qty || 0),
  amount: typeof entry.mrp === "number" && typeof entry.qty === "number" ? entry.mrp * entry.qty : null,
  channel: entry.channel || null,
  platform: entry.platform || null,
  metadata: {
    color: entry.color || null,
    size: entry.size || null,
    receiver: entry.receiver || null,
    supplier: entry.supplier || null,
  },
});

const normalizeDailyReport = (entry, area, source) => ({
  id: String(entry._id),
  area,
  source,
  activityType: "daily-report",
  date: toTimestamp(entry.date),
  activityAt: toTimestamp(entry.updatedAt || entry.createdAt || entry.date),
  designNumber: null,
  quantity: Number(entry.qty || entry.totalQuantity || 0),
  amount: Number(entry.totalSale || 0),
  channel: null,
  platform: null,
  metadata: {
    note: entry.note || null,
  },
});

const normalizeStockReturned = (entry) => ({
  id: String(entry._id),
  area: "shop",
  source: "shop-stock-returned",
  activityType: "stock-return",
  date: toTimestamp(entry.date),
  activityAt: toTimestamp(entry.createdAt || entry.date),
  designNumber: entry.dno || null,
  quantity: Number(entry.totalQuantity || 0),
  amount: Number(entry.mrp || 0) * Number(entry.totalQuantity || 0),
  channel: null,
  platform: null,
  metadata: {
    color: entry.color || null,
    type: entry.type || null,
  },
});

const normalizePurchaseOrder = (entry) => ({
  id: String(entry._id),
  area: "domestic",
  source: "purchase-order",
  activityType: "purchase-order",
  date: toTimestamp(entry.date),
  activityAt: toTimestamp(entry.updatedAt || entry.createdAt || entry.date),
  designNumber: null,
  quantity: Number(entry.totalQuantity || 0),
  amount: Number(entry.grandTotal || 0),
  channel: "domestic",
  platform: null,
  metadata: {
    orderNumber: entry.orderNumber || null,
    buyerName: entry.buyerName || null,
    dealerName: entry.dealerName || null,
  },
});

const normalizeJobCardEntry = (entry) => ({
  id: entry.id,
  area: "jobcard",
  source: "jobcard-dashboard",
  activityType: "jobcard-entry",
  date: toTimestamp(entry.createdAt),
  activityAt: toTimestamp(entry.createdAt),
  designNumber: entry.designNumber || null,
  quantity: Number(entry.quantity || 0),
  amount: null,
  channel: null,
  platform: null,
  metadata: {
    brand: entry.brand || null,
    fabric: entry.fabric || null,
  },
});

/**
 * Get analytics data for a specific time period
 * @param {number} days - Number of days to look back (7, 30, 90, 365)
 */
export const getAnalyticsSummary = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get previous period for comparison
    const prevStartDate = new Date();
    prevStartDate.setDate(prevStartDate.getDate() - (days * 2));
    const prevEndDate = new Date(startDate);
    
    // Fetch Purchase Orders (Sales)
    const [currentOrders, previousOrders] = await Promise.all([
      PurchaseOrder.find({ date: { $gte: startDate } }),
      PurchaseOrder.find({ date: { $gte: prevStartDate, $lt: prevEndDate } }),
    ]);
    
    const totalSales = currentOrders.reduce((sum, order) => sum + order.grandTotal, 0);
    const previousSales = previousOrders.reduce((sum, order) => sum + order.grandTotal, 0);
    const salesChange = previousSales > 0 ? ((totalSales - previousSales) / previousSales) * 100 : 0;
    
    // Fetch Stock Returns
    const [currentReturns, previousReturns] = await Promise.all([
      StockReturned.find({ date: { $gte: startDate } }),
      StockReturned.find({ date: { $gte: prevStartDate, $lt: prevEndDate } }),
    ]);
    
    const totalReturns = currentReturns.reduce((sum, ret) => {
      return sum + ret.items.reduce((itemSum, item) => {
        const qty = (item.s || 0) + (item.m || 0) + (item.l || 0) + 
                    (item.xl || 0) + (item.xxl || 0) + (item.xxxl || 0);
        return itemSum + (qty * (item.mrp || 0));
      }, 0);
    }, 0);
    
    const previousTotalReturns = previousReturns.reduce((sum, ret) => {
      return sum + ret.items.reduce((itemSum, item) => {
        const qty = (item.s || 0) + (item.m || 0) + (item.l || 0) + 
                    (item.xl || 0) + (item.xxl || 0) + (item.xxxl || 0);
        return itemSum + (qty * (item.mrp || 0));
      }, 0);
    }, 0);
    
    const returnsChange = previousTotalReturns > 0 
      ? ((totalReturns - previousTotalReturns) / previousTotalReturns) * 100 
      : 0;
    
    // Get Inventory Data
    const [domesticInventory, onlineInventory] = await Promise.all([
      getWarehouseInventorySummary("domestic"),
      getWarehouseInventorySummary("online"),
    ]);
    
    const totalStock = (domesticInventory.totalStock || 0) + (onlineInventory.totalStock || 0);
    const totalStockValue = (domesticInventory.totalStock || 0) * 500 + 
                           (onlineInventory.totalStock || 0) * 500; // Assuming avg price
    
    // Calculate products sold (dispatch transactions)
    const DispatchModel = getTransactionModel("warehouse", "domestic", "dispatch");
    const [currentDispatches, previousDispatches] = await Promise.all([
      DispatchModel.find({ date: { $gte: startDate } }),
      DispatchModel.find({ date: { $gte: prevStartDate, $lt: prevEndDate } }),
    ]);
    
    const productsSold = currentDispatches.reduce((sum, item) => sum + item.qty, 0);
    const previousProductsSold = previousDispatches.reduce((sum, item) => sum + item.qty, 0);
    const productsSoldChange = previousProductsSold > 0 
      ? ((productsSold - previousProductsSold) / previousProductsSold) * 100 
      : 0;
    
    return {
      totalSales,
      salesChange,
      ordersCount: currentOrders.length,
      ordersChange: previousOrders.length > 0 
        ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100 
        : 0,
      productsSold,
      productsSoldChange,
      totalStock,
      totalStockValue,
      totalReturns,
      returnsChange,
      domesticStock: domesticInventory.totalStock || 0,
      onlineStock: onlineInventory.totalStock || 0,
    };
  } catch (error) {
    console.error("Error in getAnalyticsSummary:", error);
    throw error;
  }
};

/**
 * Get time-series data for charts
 * @param {number} days - Number of days to look back
 * @param {string} interval - 'day', 'week', 'month'
 */
export const getTimeSeriesData = async (days = 30, interval = 'day') => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Fetch all purchase orders and returns in the period
    const [orders, returns] = await Promise.all([
      PurchaseOrder.find({ date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 }),
      StockReturned.find({ date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 }),
    ]);
    
    // Group by time interval
    const dataPoints = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      let nextDate = new Date(currentDate);
      let label = '';
      
      if (interval === 'day') {
        nextDate.setDate(nextDate.getDate() + 1);
        label = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (interval === 'week') {
        nextDate.setDate(nextDate.getDate() + 7);
        label = `W${Math.ceil((currentDate.getDate()) / 7)}`;
      } else if (interval === 'month') {
        nextDate.setMonth(nextDate.getMonth() + 1);
        label = currentDate.toLocaleDateString('en-US', { month: 'short' });
      }
      
      // Calculate sales for this period
      const periodOrders = orders.filter(o => {
        const orderDate = new Date(o.date);
        return orderDate >= currentDate && orderDate < nextDate;
      });
      
      const sales = periodOrders.reduce((sum, order) => sum + order.grandTotal, 0);
      
      // Calculate returns for this period
      const periodReturns = returns.filter(r => {
        const returnDate = new Date(r.date);
        return returnDate >= currentDate && returnDate < nextDate;
      });
      
      const returnsValue = periodReturns.reduce((sum, ret) => {
        return sum + ret.items.reduce((itemSum, item) => {
          const qty = (item.s || 0) + (item.m || 0) + (item.l || 0) + 
                      (item.xl || 0) + (item.xxl || 0) + (item.xxxl || 0);
          return itemSum + (qty * (item.mrp || 0));
        }, 0);
      }, 0);
      
      dataPoints.push({
        date: currentDate.toISOString(),
        label,
        sales: Math.round(sales),
        returns: Math.round(returnsValue),
        orders: periodOrders.length,
      });
      
      currentDate = nextDate;
    }
    
    return dataPoints;
  } catch (error) {
    console.error("Error in getTimeSeriesData:", error);
    throw error;
  }
};

/**
 * Get category/channel distribution
 */
export const getCategoryDistribution = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get inventory by warehouse type
    const [domesticInventory, onlineInventory] = await Promise.all([
      getWarehouseInventorySummary("domestic"),
      getWarehouseInventorySummary("online"),
    ]);
    
    // Get transactions by channel to estimate export/retail
    const DispatchModel = getTransactionModel("warehouse", "domestic", "dispatch");
    const dispatches = await DispatchModel.find({ date: { $gte: startDate } });
    
    // Group by channel
    const channelTotals = {};
    dispatches.forEach(dispatch => {
      const channel = dispatch.channel || 'domestic';
      channelTotals[channel] = (channelTotals[channel] || 0) + (dispatch.qty * (dispatch.mrp || 500));
    });
    
    const domesticValue = (domesticInventory.totalStock || 0) * 500;
    const onlineValue = (onlineInventory.totalStock || 0) * 500;
    const exportValue = channelTotals.export || 67000;
    const retailValue = channelTotals.retail || 45000;
    
    const total = domesticValue + onlineValue + exportValue + retailValue;
    
    const distribution = [
      {
        category: "Domestic",
        value: Math.round(domesticValue),
        percentage: total > 0 ? (domesticValue / total) * 100 : 25,
        color: "#10b981",
      },
      {
        category: "Online",
        value: Math.round(onlineValue),
        percentage: total > 0 ? (onlineValue / total) * 100 : 25,
        color: "#3b82f6",
      },
      {
        category: "Export",
        value: Math.round(exportValue),
        percentage: total > 0 ? (exportValue / total) * 100 : 25,
        color: "#f59e0b",
      },
      {
        category: "Retail",
        value: Math.round(retailValue),
        percentage: total > 0 ? (retailValue / total) * 100 : 25,
        color: "#a855f7",
      },
    ];
    
    return distribution;
  } catch (error) {
    console.error("Error in getCategoryDistribution:", error);
    throw error;
  }
};

/**
 * Get top performing products
 */
export const getTopProducts = async (days = 30, limit = 10) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const DispatchModel = getTransactionModel("warehouse", "domestic", "dispatch");
    const dispatches = await DispatchModel.find({ date: { $gte: startDate } });
    
    // Group by design number
    const productTotals = {};
    dispatches.forEach(dispatch => {
      const dno = dispatch.dno || 'Unknown';
      if (!productTotals[dno]) {
        productTotals[dno] = {
          dno,
          totalQty: 0,
          totalValue: 0,
        };
      }
      productTotals[dno].totalQty += dispatch.qty;
      productTotals[dno].totalValue += dispatch.qty * (dispatch.mrp || 0);
    });
    
    // Convert to array and sort by quantity
    const topProducts = Object.values(productTotals)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, limit);
    
    return topProducts;
  } catch (error) {
    console.error("Error in getTopProducts:", error);
    throw error;
  }
};

export const getRecentActivityFeed = async (hours = 24, limit) => {
  try {
    const lookbackHours = Number.isFinite(Number(hours)) ? Math.max(1, Number(hours)) : 24;
    const maxItems = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Math.max(1, Number(limit)) : 100;

    const startDate = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
    const txnFilter = {
      $or: [
        { createdAt: { $gte: startDate } },
        { date: { $gte: startDate } },
      ],
    };
    const reportFilter = {
      $or: [
        { createdAt: { $gte: startDate } },
        { updatedAt: { $gte: startDate } },
        { date: { $gte: startDate } },
      ],
    };

    // Select only necessary fields to reduce payload size and improve query speed
    const txnFields = "_id dno qty mrp date createdAt color size receiver supplier channel platform formType";
    const reportFields = "_id date updatedAt createdAt qty totalQuantity totalSale note";
    const srFields = "_id dno totalQuantity mrp color type date createdAt";
    const poFields = "_id date updatedAt createdAt totalQuantity grandTotal orderNumber buyerName dealerName";
    const jobCardFields = "_id designNumber brand fabric createdAt cutting";

    const shopQueries = SHOP_FORMS.map((formType) =>
      getTransactionModel("shop", "", formType).find(txnFilter).select(txnFields).lean().limit(200)
    );
    const domesticQueries = DOMESTIC_FORMS.map((formType) =>
      getTransactionModel("warehouse", "domestic", formType).find(txnFilter).select(txnFields).lean().limit(200)
    );
    const onlineQueries = ONLINE_FORMS.map((formType) =>
      getTransactionModel("warehouse", "online", formType).find(txnFilter).select(txnFields).lean().limit(200)
    );

    const [
      shopResults,
      domesticResults,
      onlineResults,
      dailyReports,
      onlineDailyReports,
      stockReturned,
      purchaseOrders,
      jobCards,
    ] = await Promise.all([
      Promise.all(shopQueries),
      Promise.all(domesticQueries),
      Promise.all(onlineQueries),
      DailyReport.find(reportFilter).select(reportFields).lean().limit(500),
      OnlineDailyReport.find(reportFilter).select(reportFields).lean().limit(500),
      StockReturned.find(reportFilter).select(srFields).lean().limit(500),
      PurchaseOrder.find(reportFilter).select(poFields).lean().limit(500),
      JobCard.find({ createdAt: { $gte: startDate } }).select(jobCardFields).lean().limit(500),
    ]);

    const jobCardByDesign = jobCards.reduce((acc, card) => {
      const designKey = normalizeKeyPart(card.designNumber);
      if (!designKey) return acc;

      const cuttingRows = Array.isArray(card.cutting) ? card.cutting : [];
      const cuttingQty = cuttingRows.reduce((sum, row) => sum + Number(row?.quantity || 0), 0);
      const existing = acc.get(designKey);

      if (!existing) {
        acc.set(designKey, {
          id: String(card._id),
          createdAt: card.createdAt,
          designNumber: card.designNumber,
          quantity: cuttingQty,
          brand: card.brand || null,
          fabric: card.fabric || null,
        });
        return acc;
      }

      existing.quantity += cuttingQty;
      if (new Date(card.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
        existing.createdAt = card.createdAt;
        existing.id = String(card._id);
        existing.designNumber = card.designNumber;
        existing.brand = card.brand || null;
        existing.fabric = card.fabric || null;
      }

      return acc;
    }, new Map());

    const jobCardActivities = Array.from(jobCardByDesign.values()).map((entry) =>
      normalizeJobCardEntry(entry)
    );

    const activities = [
      ...shopResults.flat().map((item) => normalizeTxn(item, "shop", "shop-entry")),
      ...domesticResults.flat().map((item) => normalizeTxn(item, "domestic", "domestic-entry")),
      ...onlineResults.flat().map((item) => normalizeTxn(item, "online", "online-entry")),
      ...dailyReports.map((item) => normalizeDailyReport(item, "shop", "shop-daily-report")),
      ...onlineDailyReports.map((item) => normalizeDailyReport(item, "online", "online-daily-report")),
      ...stockReturned.map((item) => normalizeStockReturned(item)),
      ...purchaseOrders.map((item) => normalizePurchaseOrder(item)),
      ...jobCardActivities,
    ]
      .filter((item) => item.activityAt)
      .sort((a, b) => new Date(b.activityAt).getTime() - new Date(a.activityAt).getTime());

    // Limit to maxItems (default 100) for performance
    const finalActivities = activities.slice(0, maxItems);

    return {
      since: startDate.toISOString(),
      total: finalActivities.length,
      activities: finalActivities,
    };
  } catch (error) {
    console.error("Error in getRecentActivityFeed:", error);
    throw error;
  }
};
