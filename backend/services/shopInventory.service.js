import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTransactionModel } from '../models/Transaction.js';
import { 
  normalizeDesignNumber, 
  normalizeColor, 
  normalizeSize,
  createInventoryKey 
} from '../utils/normalization.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ShopInventoryService {
  constructor() {
    this.importDataPath = path.join(__dirname, '../data/import_data.json');
    this.returnDataPath = path.join(__dirname, '../data/return_data.json');
    this.salesDataPath = path.join(__dirname, '../data/sales_data.json');
    this.shopInventoryPath = path.join(__dirname, '../../shop_inventory.json');
  }

  // Load JSON file
  async loadJsonFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading ${filePath}:`, error);
      return [];
    }
  }

  // Save JSON file
  async saveJsonFile(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error(`Error saving ${filePath}:`, error);
      return false;
    }
  }

  // Load transactions from database
  async loadTransactionsFromDB(formType) {
    try {
      const Model = getTransactionModel('shop', '', formType);
      const transactions = await Model.find({}).lean();
      
      console.log(`[Shop Inventory] Loading ${formType} transactions: ${transactions.length} found`);
      
      // Convert database format to the format used by JSON files
      // Group by dno, color and aggregate sizes
      const grouped = {};
      
      transactions.forEach(txn => {
        const dno = normalizeDesignNumber(txn.dno);
        const color = normalizeColor(txn.color);
        const size = normalizeSize(txn.size);
        const qty = Number(txn.qty) || 0;
        
        // Log return transactions specifically
        if (formType === 'return') {
          console.log(`[Shop Inventory] Return transaction: DNO=${dno}, Color=${color}, Size=${size}, Qty=${qty}`);
        }
        
        if (!dno || !size || qty === 0) {
          if (formType === 'return' && qty === 0) {
            console.log(`[Shop Inventory] Skipping ${formType} transaction with qty=0`);
          }
          return;
        }
        
        const key = `${dno}|${color}`;
        if (!grouped[key]) {
          grouped[key] = {
            dno,
            color,
            sizes: {},
            totalQty: 0,
            type: formType
          };
        }
        
        // Preserve sign for proper deduction of stock returns
        grouped[key].sizes[size] = (grouped[key].sizes[size] || 0) + qty;
        grouped[key].totalQty += qty;
      });
      
      const result = Object.values(grouped);
      console.log(`[Shop Inventory] Grouped ${formType} into ${result.length} design groups`);
      
      return result;
    } catch (error) {
      console.error(`Error loading ${formType} transactions from DB:`, error);
      return [];
    }
  }

  // Load transactions from database for stock returns only
  async loadStockReturnsFromDB() {
    try {
      const Model = getTransactionModel('shop', '', 'return');
      // Stock returns: Channel 'domestic return' = items being sent back to warehouse
      const transactions = await Model.find({ channel: 'domestic return' }).lean();
      
      console.log(`[Shop Inventory] Loading stock returns from DB: ${transactions.length} found`);
      
      const grouped = {};
      
      transactions.forEach(txn => {
        const dno = normalizeDesignNumber(txn.dno);
        const color = normalizeColor(txn.color);
        const size = normalizeSize(txn.size);
        const qty = Number(txn.qty) || 0;
        
        console.log(`[Shop Inventory] Stock return: DNO=${dno}, Color=${color}, Size=${size}, Qty=${qty}`);
        
        if (!dno || !size || qty === 0) return;
        
        const key = `${dno}|${color}`;
        if (!grouped[key]) {
          grouped[key] = {
            dno,
            color,
            sizes: {},
            totalQty: 0,
            type: 'stock_return'
          };
        }
        
        grouped[key].sizes[size] = (grouped[key].sizes[size] || 0) + qty;
        grouped[key].totalQty += qty;
      });
      
      const result = Object.values(grouped);
      console.log(`[Shop Inventory] Grouped stock returns into ${result.length} design groups`);
      
      return result;
    } catch (error) {
      console.error(`Error loading stock returns from DB:`, error);
      return [];
    }
  }

  // Load customer returns from database only
  async loadCustomerReturnsFromDB() {
    try {
      const Model = getTransactionModel('shop', '', 'return');
      // Customer returns: All other returns (NOT 'domestic return' channel)
      const transactions = await Model.find({ channel: { $ne: 'domestic return' } }).lean();

      console.log(`[Shop Inventory] Loading customer returns from DB: ${transactions.length} found`);

      const grouped = {};

      transactions.forEach(txn => {
        const dno = normalizeDesignNumber(txn.dno);
        const color = normalizeColor(txn.color);
        const size = normalizeSize(txn.size);
        const qty = Number(txn.qty) || 0;

        if (!dno || !size || qty === 0) return;

        const key = `${dno}|${color}`;
        if (!grouped[key]) {
          grouped[key] = {
            dno,
            color,
            sizes: {},
            totalQty: 0,
            type: 'customer_return'
          };
        }

        grouped[key].sizes[size] = (grouped[key].sizes[size] || 0) + qty;
        grouped[key].totalQty += qty;
      });

      const result = Object.values(grouped);
      console.log(`[Shop Inventory] Grouped customer returns into ${result.length} design groups`);

      return result;
    } catch (error) {
      console.error(`Error loading customer returns from DB:`, error);
      return [];
    }
  }

  // Calculate shop inventory
  async calculateInventory() {
    try {
      // Load all data from JSON files (legacy data)
      const importDataFromFile = await this.loadJsonFile(this.importDataPath);
      const customerReturnDataFromFile = await this.loadJsonFile(this.returnDataPath);
      const salesDataFromFile = await this.loadJsonFile(this.salesDataPath);

      // Load data from database (new transactions)
      const importDataFromDB = await this.loadTransactionsFromDB('import');
      const customerReturnDataFromDB = await this.loadCustomerReturnsFromDB();
      const salesDataFromDB = await this.loadTransactionsFromDB('sales');
      const stockReturnsFromDB = await this.loadStockReturnsFromDB();

      // Combine file data and database data
      const importData = [...importDataFromFile, ...importDataFromDB];
      const customerReturnData = [...customerReturnDataFromFile, ...customerReturnDataFromDB];
      const salesData = [...salesDataFromFile, ...salesDataFromDB];
      const stockReturnData = stockReturnsFromDB;

      console.log(`📦 Data sources combined:`);
      console.log(`   Import: ${importDataFromFile.length} (file) + ${importDataFromDB.length} (DB) = ${importData.length}`);
      console.log(`   Customer Return: ${customerReturnDataFromFile.length} (file) + ${customerReturnDataFromDB.length} (DB) = ${customerReturnData.length}`);
      console.log(`   Stock Return: ${stockReturnData.length} (from DB)`);
      console.log(`   Sales: ${salesDataFromFile.length} (file) + ${salesDataFromDB.length} (DB) = ${salesData.length}`);

      // Log sample customer return data for debugging
      if (customerReturnData.length > 0) {
        console.log(`\n📋 Sample customer return data (first 3):`);
        customerReturnData.slice(0, 3).forEach(item => {
          console.log(`   DNO: ${item.dno}, Color: ${item.color}, Sizes:`, item.sizes);
        });
      }

      // Log sample stock return data for debugging
      if (stockReturnData.length > 0) {
        console.log(`\n📋 Sample stock return data (first 3):`);
        stockReturnData.slice(0, 3).forEach(item => {
          console.log(`   DNO: ${item.dno}, Color: ${item.color}, Qty: ${item.totalQty}`);
        });
      }

      // Create a map to store inventory: key = "designNumber|color|size"
      const inventoryMap = new Map();

      // Process import data (add to inventory)
      for (const item of importData) {
        const dno = normalizeDesignNumber(item.dno);
        const color = normalizeColor(item.color);
        
        if (item.sizes && typeof item.sizes === 'object') {
          for (const [size, qty] of Object.entries(item.sizes)) {
            const normalizedSize = normalizeSize(size);
            const key = `${dno}|${color}|${normalizedSize}`;
            
            if (!inventoryMap.has(key)) {
              inventoryMap.set(key, {
                designNumber: dno,
                color: color,
                size: normalizedSize,
                import: 0,
                customerReturn: 0,
                stockReturn: 0,
                sales: 0,
                net: 0,
                type: item.type || 'regular'
              });
            }
            
            const record = inventoryMap.get(key);
            record.import += Number(qty) || 0;
          }
        }
      }

      // Process customer return data (ADD to inventory - items coming back to shop)
      let customerReturnProcessedCount = 0;
      for (const item of customerReturnData) {
        const dno = normalizeDesignNumber(item.dno);
        const color = normalizeColor(item.color);
        
        if (item.sizes && typeof item.sizes === 'object') {
          for (const [size, qty] of Object.entries(item.sizes)) {
            const normalizedSize = normalizeSize(size);
            const key = `${dno}|${color}|${normalizedSize}`;
            
            if (!inventoryMap.has(key)) {
              inventoryMap.set(key, {
                designNumber: dno,
                color: color,
                size: normalizedSize,
                import: 0,
                customerReturn: 0,
                stockReturn: 0,
                sales: 0,
                net: 0,
                type: item.type || 'regular'
              });
            }
            
            const record = inventoryMap.get(key);
            const qtyNum = Number(qty) || 0;
            // ✅ CUSTOMER RETURNS: Positive value - ADD to inventory
            record.customerReturn += qtyNum;
            
            if (customerReturnProcessedCount < 5) {
              console.log(`[Shop Inventory] ✅ Customer Return: DNO=${dno}, Color=${color}, Size=${normalizedSize}, Qty=${qtyNum}, New total=${record.customerReturn}`);
            }
            customerReturnProcessedCount++;
          }
        }
      }
      console.log(`[Shop Inventory] Processed ${customerReturnProcessedCount} customer return entries`);

      // Process stock return data (SUBTRACT from inventory - items going back to warehouse)
      let stockReturnProcessedCount = 0;
      for (const item of stockReturnData) {
        const dno = normalizeDesignNumber(item.dno);
        const color = normalizeColor(item.color);
        
        if (item.sizes && typeof item.sizes === 'object') {
          for (const [size, qty] of Object.entries(item.sizes)) {
            const normalizedSize = normalizeSize(size);
            const key = `${dno}|${color}|${normalizedSize}`;
            
            if (!inventoryMap.has(key)) {
              inventoryMap.set(key, {
                designNumber: dno,
                color: color,
                size: normalizedSize,
                import: 0,
                customerReturn: 0,
                stockReturn: 0,
                sales: 0,
                net: 0,
                type: item.type || 'regular'
              });
            }
            
            const record = inventoryMap.get(key);
            const qtyNum = Number(qty) || 0;
            // ❌ STOCK RETURNS: Negative value - SUBTRACT from inventory
            record.stockReturn += qtyNum;
            
            if (stockReturnProcessedCount < 5) {
              console.log(`[Shop Inventory] ❌ Stock Return: DNO=${dno}, Color=${color}, Size=${normalizedSize}, Qty=${qtyNum}, New total=${record.stockReturn}`);
            }
            stockReturnProcessedCount++;
          }
        }
      }
      console.log(`[Shop Inventory] Processed ${stockReturnProcessedCount} stock return entries`);

      // Process sales data (subtract from inventory)
      for (const item of salesData) {
        const dno = normalizeDesignNumber(item.dno);
        const color = normalizeColor(item.color);
        
        if (item.sizes && typeof item.sizes === 'object') {
          for (const [size, qty] of Object.entries(item.sizes)) {
            const normalizedSize = normalizeSize(size);
            const key = `${dno}|${color}|${normalizedSize}`;
            
            if (!inventoryMap.has(key)) {
              inventoryMap.set(key, {
                designNumber: dno,
                color: color,
                size: normalizedSize,
                import: 0,
                customerReturn: 0,
                stockReturn: 0,
                sales: 0,
                net: 0,
                type: item.type || 'regular'
              });
            }
            
            const record = inventoryMap.get(key);
            record.sales += Number(qty) || 0;
          }
        }
      }

      // Calculate net quantity for each record
      // Net = Import + CustomerReturn - StockReturn - Sales
      // Logic: Start with imports, ADD customer returns, SUBTRACT stock returns, SUBTRACT sales
      let calculatedCount = 0;
      const inventory = Array.from(inventoryMap.values()).map(record => {
        // Clear formula: 
        // Net = Import + CustomerReturn - StockReturn - Sales
        record.net = record.import + record.customerReturn - record.stockReturn - record.sales;
        
        // Log sample calculations for debugging (first 5 with returns)
        if ((record.customerReturn !== 0 || record.stockReturn !== 0) && calculatedCount < 5) {
          console.log(`[Shop Inventory] 📊 Net calculation: DNO=${record.designNumber}, Size=${record.size}`);
          console.log(`   Import=${record.import}, CustomerReturn=+${record.customerReturn}, StockReturn=-${record.stockReturn}, Sales=${record.sales}`);
          console.log(`   Net = ${record.import} + ${record.customerReturn} - ${record.stockReturn} - ${record.sales} = ${record.net}`);
          calculatedCount++;
        }
        
        // Ensure no negative net quantity
        if (record.net < 0) {
          console.log(`[Shop Inventory] ⚠️ Negative net (${record.net}) for ${record.designNumber}|${record.color}|${record.size}, setting to 0`);
          record.net = 0;
        }
        
        return record;
      });

      // Sort by design number, then color, then size
      inventory.sort((a, b) => {
        if (a.designNumber !== b.designNumber) {
          return a.designNumber.localeCompare(b.designNumber);
        }
        if (a.color !== b.color) {
          return a.color.localeCompare(b.color);
        }
        
        // Size ordering: XS, S, M, L, XL, XXL, 3XL, 4XL, 5XL
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
        const aIndex = sizeOrder.indexOf(a.size);
        const bIndex = sizeOrder.indexOf(b.size);
        
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        return a.size.localeCompare(b.size);
      });

      // Save to shop_inventory.json
      await this.saveJsonFile(this.shopInventoryPath, inventory);

      return {
        success: true,
        totalRecords: inventory.length,
        message: 'Shop inventory calculated and saved successfully'
      };
    } catch (error) {
      console.error('Error calculating inventory:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get shop inventory with filters
  async getInventory(filters = {}) {
    try {
      let inventory = await this.loadJsonFile(this.shopInventoryPath);

      // Apply filters
      if (filters.designNumber) {
        const searchTerm = normalizeDesignNumber(filters.designNumber);
        inventory = inventory.filter(item => 
          item.designNumber.includes(searchTerm)
        );
      }

      if (filters.color) {
        const searchColor = normalizeColor(filters.color);
        inventory = inventory.filter(item => 
          item.color.includes(searchColor)
        );
      }

      if (filters.size) {
        const searchSize = normalizeSize(filters.size);
        inventory = inventory.filter(item => 
          item.size === searchSize
        );
      }

      // Filter out items with zero net quantity (optional)
      if (filters.hideZeroStock === 'true' || filters.hideZeroStock === true) {
        inventory = inventory.filter(item => item.net > 0);
      }

      return {
        success: true,
        data: inventory,
        totalRecords: inventory.length
      };
    } catch (error) {
      console.error('Error getting inventory:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Get inventory grouped by design number
  async getInventoryGrouped(designNumber) {
    try {
      const inventory = await this.loadJsonFile(this.shopInventoryPath);
      const normalizedDN = normalizeDesignNumber(designNumber);
      
      // Filter by design number
      const items = inventory.filter(item => 
        item.designNumber === normalizedDN
      );

      // Group by color
      const grouped = items.reduce((acc, item) => {
        if (!acc[item.color]) {
          acc[item.color] = [];
        }
        acc[item.color].push(item);
        return acc;
      }, {});

      return {
        success: true,
        designNumber: normalizedDN,
        data: grouped,
        totalColors: Object.keys(grouped).length
      };
    } catch (error) {
      console.error('Error getting grouped inventory:', error);
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  }
}

export default new ShopInventoryService();
