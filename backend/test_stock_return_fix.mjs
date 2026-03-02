#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: './backend/.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shopInventoryPath = path.join(__dirname, 'shop_inventory.json');

// Import models and services
import { getTransactionModel } from './backend/models/Transaction.js';
import shopInventoryService from './backend/services/shopInventory.service.js';
import { normalizeDesignNumber, normalizeColor, normalizeSize } from './backend/utils/normalization.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-system';
const DB_NAME = process.env.DB_NAME || 'inventory-system';

async function loadJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

async function connectDB() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
    });
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function getSampleImportItem() {
  // Find a real item from import_data for testing
  const importData = await loadJsonFile(path.join(__dirname, 'backend/data/import_data.json'));
  if (importData && importData.length > 0) {
    const item = importData[0];
    return {
      designNumber: normalizeDesignNumber(item.dno),
      color: normalizeColor(item.color),
      size: Object.keys(item.sizes)[0],
      qty: item.sizes[Object.keys(item.sizes)[0]]
    };
  }
  return null;
}

async function testStockReturnSubtraction() {
  try {
    console.log('========================================');
    console.log('TEST: Stock Return Subtraction from Shop Inventory');
    console.log('========================================\n');

    // Step 1: Get initial inventory for a design
    console.log('📊 Step 1: Loading current shop inventory...');
    let inventory = await loadJsonFile(shopInventoryPath);
    
    if (!inventory) {
      console.log('⚠️  No shop inventory file found. Calculating...');
      await shopInventoryService.calculateInventory();
      inventory = await loadJsonFile(shopInventoryPath);
    }

    // Step 2: Find a test item with inventory
    console.log('📊 Step 2: Finding test items...\n');
    
    const testItems = [
      {
        dno: 'NG-19728',
        color: 'GREY MELANGE',
        size: 'M',
        descr: 'Test Item 1 (from JSON data)'
      },
      {
        dno: 'NG-19727',
        color: 'BLACK',
        size: 'L',
        descr: 'Test Item 2 (from JSON data)'
      }
    ];

    for (const testItem of testItems) {
      console.log(`\n💾 Testing with: ${testItem.descr}`);
      console.log(`   DNO: ${testItem.dno}, Color: ${testItem.color}, Size: ${testItem.size}`);

      // Find current inventory before return
      const currentInv = inventory.find(
        inv => 
          normalizeDesignNumber(inv.designNumber) === normalizeDesignNumber(testItem.dno) &&
          normalizeColor(inv.color) === normalizeColor(testItem.color) &&
          normalizeSize(inv.size) === normalizeSize(testItem.size)
      );

      if (currentInv) {
        console.log(`   📦 Current shop inventory (net): ${currentInv.net}`);
        console.log(`      (Import: ${currentInv.import}, Return: ${currentInv.return}, Sales: ${currentInv.sales})`);
      } else {
        console.log(`   📦 No current inventory found for this item`);
      }

      // Step 3: Create a stock return record
      console.log(`\n📝 Step 3: Creating stock return record...`);
      const returnQty = 1;
      
      const ShopModel = getTransactionModel('shop', '', 'return');
      const shopRecord = await ShopModel.create({
        domain: 'shop',
        formType: 'return',
        dno: testItem.dno,
        color: testItem.color,
        size: testItem.size,
        qty: -returnQty,  // Negative to subtract from shop
        date: new Date(),
        channel: 'domestic return',
      });
      
      console.log(`✅ Created shop return record:`);
      console.log(`   ID: ${shopRecord._id}`);
      console.log(`   Qty: ${shopRecord.qty} (negative to subtract)`);

      // Step 4: Recalculate inventory
      console.log(`\n🔄 Step 4: Recalculating shop inventory...`);
      const result = await shopInventoryService.calculateInventory();
      
      if (result.success) {
        console.log(`✅ Inventory recalculated: ${result.totalRecords} records`);
      } else {
        console.log(`❌ Inventory calculation failed:`, result.error);
        continue;
      }

      // Step 5: Check new inventory
      console.log(`\n📊 Step 5: Checking updated inventory...`);
      const updatedInventory = await loadJsonFile(shopInventoryPath);
      const updatedInv = updatedInventory.find(
        inv => 
          normalizeDesignNumber(inv.designNumber) === normalizeDesignNumber(testItem.dno) &&
          normalizeColor(inv.color) === normalizeColor(testItem.color) &&
          normalizeSize(inv.size) === normalizeSize(testItem.size)
      );

      if (updatedInv) {
        console.log(`✅ Updated inventory (net): ${updatedInv.net}`);
        console.log(`   (Import: ${updatedInv.import}, Return: ${updatedInv.return}, Sales: ${updatedInv.sales})`);
        
        // Check if subtraction worked
        if (currentInv) {
          const expectedNet = currentInv.net - returnQty;
          const actualNet = updatedInv.net;
          
          console.log(`\n✓ VERIFICATION:`);
          console.log(`  Expected net: ${currentInv.net} - ${returnQty} = ${expectedNet}`);
          console.log(`  Actual net: ${actualNet}`);
          
          if (actualNet === expectedNet) {
            console.log(`  ✅ PASS: Stock return correctly subtracted!`);
          } else {
            console.log(`  ❌ FAIL: Stock return not properly subtracted`);
          }
        }
      }

      // Cleanup: Remove the test record
      console.log(`\n🧹 Cleanup: Removing test record...`);
      await ShopModel.deleteOne({ _id: shopRecord._id });
      console.log(`✅ Test record removed`);
    }

    // Final: Recalculate to clean up
    console.log(`\n🔄 Final recalculation to clean up...`);
    await shopInventoryService.calculateInventory();
    console.log(`✅ Inventory cleaned up\n`);

    console.log('========================================');
    console.log('TEST COMPLETE');
    console.log('========================================');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

async function main() {
  try {
    await connectDB();
    await testStockReturnSubtraction();
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
