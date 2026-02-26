import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTransactionModel } from '../models/Transaction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ShopInventoryService {
  constructor() {
    this.importDataPath = path.join(__dirname, '../data/import_data.json');
    this.returnDataPath = path.join(__dirname, '../data/return_data.json');
    this.salesDataPath = path.join(__dirname, '../data/sales_data.json');
    this.shopInventoryPath = path.join(__dirname, '../../shop_inventory.json');
  }

  // Normalize design number (handle aw-85089a and aaw-85089a as same)
  normalizeDesignNumber(dno) {
    if (!dno) return '';
    const normalized = dno.toLowerCase().trim();
    // Remove leading 'a' if it starts with 'aaw-' to make it 'aw-'
    if (normalized.startsWith('aaw-')) {
      return normalized.substring(1); // Remove first 'a'
    }
    return normalized;
  }

  // Normalize color
  normalizeColor(color) {
    if (!color) return '';
    return color.toUpperCase().trim();
  }

  // Normalize size
  normalizeSize(size) {
    if (!size) return '';
    return size.toUpperCase().trim();
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
        const dno = this.normalizeDesignNumber(txn.dno);
        const color = this.normalizeColor(txn.color);
        const size = this.normalizeSize(txn.size);
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

  // Calculate shop inventory
  async calculateInventory() {
    try {
      // Load all data from JSON files (legacy data)
      const importDataFromFile = await this.loadJsonFile(this.importDataPath);
      const returnDataFromFile = await this.loadJsonFile(this.returnDataPath);
      const salesDataFromFile = await this.loadJsonFile(this.salesDataPath);

      // Load data from database (new transactions)
      const importDataFromDB = await this.loadTransactionsFromDB('import');
      const returnDataFromDB = await this.loadTransactionsFromDB('return');
      const salesDataFromDB = await this.loadTransactionsFromDB('sales');

      // Combine file data and database data
      const importData = [...importDataFromFile, ...importDataFromDB];
      const returnData = [...returnDataFromFile, ...returnDataFromDB];
      const salesData = [...salesDataFromFile, ...salesDataFromDB];

      console.log(`📦 Data sources combined:`);
      console.log(`   Import: ${importDataFromFile.length} (file) + ${importDataFromDB.length} (DB) = ${importData.length}`);
      console.log(`   Return: ${returnDataFromFile.length} (file) + ${returnDataFromDB.length} (DB) = ${returnData.length}`);
      console.log(`   Sales: ${salesDataFromFile.length} (file) + ${salesDataFromDB.length} (DB) = ${salesData.length}`);

      // Log sample return data for debugging
      if (returnData.length > 0) {
        console.log(`\n📋 Sample return data (first 3):`);
        returnData.slice(0, 3).forEach(item => {
          console.log(`   DNO: ${item.dno}, Color: ${item.color}, Sizes:`, item.sizes);
        });
      }

      // Create a map to store inventory: key = "designNumber|color|size"
      const inventoryMap = new Map();

      // Process import data (add to inventory)
      for (const item of importData) {
        const dno = this.normalizeDesignNumber(item.dno);
        const color = this.normalizeColor(item.color);
        
        if (item.sizes && typeof item.sizes === 'object') {
          for (const [size, qty] of Object.entries(item.sizes)) {
            const normalizedSize = this.normalizeSize(size);
            const key = `${dno}|${color}|${normalizedSize}`;
            
            if (!inventoryMap.has(key)) {
              inventoryMap.set(key, {
                designNumber: dno,
                color: color,
                size: normalizedSize,
                import: 0,
                return: 0,
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

      // Process return data (add to inventory)
      let returnProcessedCount = 0;
      for (const item of returnData) {
        const dno = this.normalizeDesignNumber(item.dno);
        const color = this.normalizeColor(item.color);
        
        if (item.sizes && typeof item.sizes === 'object') {
          for (const [size, qty] of Object.entries(item.sizes)) {
            const normalizedSize = this.normalizeSize(size);
            const key = `${dno}|${color}|${normalizedSize}`;
            
            if (!inventoryMap.has(key)) {
              inventoryMap.set(key, {
                designNumber: dno,
                color: color,
                size: normalizedSize,
                import: 0,
                return: 0,
                sales: 0,
                net: 0,
                type: item.type || 'regular'
              });
            }
            
            const record = inventoryMap.get(key);
            const qtyNum = Number(qty) || 0;
            // Preserve sign: negative quantities (stock returns) subtract, positive add
            record.return += qtyNum;
            
            // Log return processing for debugging
            if (returnProcessedCount < 5) {
              console.log(`[Shop Inventory] Processing return: DNO=${dno}, Color=${color}, Size=${normalizedSize}, Qty=${qtyNum}, New return total=${record.return}`);
            }
            returnProcessedCount++;
          }
        }
      }
      console.log(`[Shop Inventory] Processed ${returnProcessedCount} return entries`);


      // Process sales data (subtract from inventory)
      for (const item of salesData) {
        const dno = this.normalizeDesignNumber(item.dno);
        const color = this.normalizeColor(item.color);
        
        if (item.sizes && typeof item.sizes === 'object') {
          for (const [size, qty] of Object.entries(item.sizes)) {
            const normalizedSize = this.normalizeSize(size);
            const key = `${dno}|${color}|${normalizedSize}`;
            
            if (!inventoryMap.has(key)) {
              inventoryMap.set(key, {
                designNumber: dno,
                color: color,
                size: normalizedSize,
                import: 0,
                return: 0,
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
      // Net = (Import + Return) - Sales
      // Ensure no negative values
      let calculatedCount = 0;
      const inventory = Array.from(inventoryMap.values()).map(record => {
        const oldNet = record.net;
        record.net = (record.import + record.return) - record.sales;
        
        // Log sample calculations for debugging (first 5 with returns)
        if (record.return !== 0 && calculatedCount < 5) {
          console.log(`[Shop Inventory] Net calculation: DNO=${record.designNumber}, Size=${record.size}`);
          console.log(`   Import=${record.import}, Return=${record.return}, Sales=${record.sales}`);
          console.log(`   Net = (${record.import} + ${record.return}) - ${record.sales} = ${record.net}`);
          calculatedCount++;
        }
        
        // Ensure no negative net quantity
        if (record.net < 0) {
          console.log(`[Shop Inventory] ⚠️ Negative net (${record.net}) for ${record.designNumber}, setting to 0`);
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
        const searchTerm = this.normalizeDesignNumber(filters.designNumber);
        inventory = inventory.filter(item => 
          item.designNumber.includes(searchTerm)
        );
      }

      if (filters.color) {
        const searchColor = this.normalizeColor(filters.color);
        inventory = inventory.filter(item => 
          item.color.includes(searchColor)
        );
      }

      if (filters.size) {
        const searchSize = this.normalizeSize(filters.size);
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
      const normalizedDN = this.normalizeDesignNumber(designNumber);
      
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
