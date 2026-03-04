#!/usr/bin/env node

/**
 * INVENTORY RECALCULATION SCRIPT
 * 
 * This script recalculates ALL inventory using the current formula:
 * Net = Import + CustomerReturn - StockReturn - Sales
 * 
 * - Stock Returns (items going back to warehouse): SUBTRACTED
 * - Customer Returns (items coming back from customers): ADDED
 * 
 * This applies to ALL historical data in the system.
 */

import mongoose from 'mongoose';
import { getTransactionModel } from './models/Transaction.js';
import shopInventoryService from './services/shopInventory.service.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-management';

console.log('='.repeat(100));
console.log(' 🔄 INVENTORY RECALCULATION - APPLY CURRENT FORMULA TO ALL DATA');
console.log('='.repeat(100));
console.log('\n📝 Current Calculation Formula:');
console.log('   Net = Import + CustomerReturn - StockReturn - Sales\n');
console.log('   ✅ Customer Returns: Items FROM customers TO shop → ADDED');
console.log('   ❌ Stock Returns: Items FROM shop TO warehouse → SUBTRACTED\n');
console.log('='.repeat(100));

async function analyzeData() {
  try {
    // Connect to database
    console.log('\n📡 Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all shop transactions
    const ShopReturn = getTransactionModel('shop', '', 'return');
    const ShopImport = getTransactionModel('shop', '', 'import');
    const ShopSales = getTransactionModel('shop', '', 'sales');

    const allReturns = await ShopReturn.find({}).lean();
    const allImports = await ShopImport.find({}).lean();
    const allSales = await ShopSales.find({}).lean();

    console.log('📊 DATA ANALYSIS:');
    console.log('─'.repeat(100));
    console.log(`   Total Import Transactions: ${allImports.length}`);
    console.log(`   Total Sales Transactions: ${allSales.length}`);
    console.log(`   Total Return Transactions: ${allReturns.length}`);

    // Analyze returns by channel
    const stockReturns = allReturns.filter(r => r.channel === 'domestic return');
    const customerReturns = allReturns.filter(r => r.channel !== 'domestic return');

    console.log(`\n   ❌ Stock Returns (channel = 'domestic return'): ${stockReturns.length}`);
    console.log(`   ✅ Customer Returns (other channels): ${customerReturns.length}`);

    // Calculate totals
    const totalImportQty = allImports.reduce((sum, t) => sum + (Number(t.qty) || 0), 0);
    const totalSalesQty = allSales.reduce((sum, t) => sum + (Number(t.qty) || 0), 0);
    const totalStockReturnQty = stockReturns.reduce((sum, t) => sum + (Number(t.qty) || 0), 0);
    const totalCustomerReturnQty = customerReturns.reduce((sum, t) => sum + (Number(t.qty) || 0), 0);

    console.log('\n📦 QUANTITY TOTALS:');
    console.log('─'.repeat(100));
    console.log(`   Import Qty: ${totalImportQty}`);
    console.log(`   Sales Qty: ${totalSalesQty}`);
    console.log(`   Stock Return Qty: ${totalStockReturnQty} (will be SUBTRACTED)`);
    console.log(`   Customer Return Qty: ${totalCustomerReturnQty} (will be ADDED)`);

    // Show sample stock returns
    if (stockReturns.length > 0) {
      console.log('\n📋 SAMPLE STOCK RETURNS (First 5):');
      console.log('─'.repeat(100));
      stockReturns.slice(0, 5).forEach((r, i) => {
        console.log(`   ${i + 1}. DNO: ${r.dno}, Color: ${r.color}, Size: ${r.size}, Qty: ${r.qty}, Channel: ${r.channel}`);
      });
    }

    // Show sample customer returns
    if (customerReturns.length > 0) {
      console.log('\n📋 SAMPLE CUSTOMER RETURNS (First 5):');
      console.log('─'.repeat(100));
      customerReturns.slice(0, 5).forEach((r, i) => {
        console.log(`   ${i + 1}. DNO: ${r.dno}, Color: ${r.color}, Size: ${r.size}, Qty: ${r.qty}, Channel: ${r.channel || 'N/A'}`);
      });
    }

    return {
      totalImports: allImports.length,
      totalSales: allSales.length,
      totalStockReturns: stockReturns.length,
      totalCustomerReturns: customerReturns.length,
      totalImportQty,
      totalSalesQty,
      totalStockReturnQty,
      totalCustomerReturnQty
    };

  } catch (error) {
    console.error('❌ Error analyzing data:', error.message);
    throw error;
  }
}

async function recalculateInventory() {
  try {
    console.log('\n\n' + '='.repeat(100));
    console.log(' 🔄 RUNNING RECALCULATION ON ALL DATA');
    console.log('='.repeat(100));
    console.log('\n⏳ Processing all transactions and applying current formula...\n');

    const result = await shopInventoryService.calculateInventory();

    if (result.success) {
      console.log('\n✅ RECALCULATION COMPLETE!');
      console.log('─'.repeat(100));
      console.log(`   Total Inventory Records: ${result.totalRecords}`);
      console.log(`   Formula Applied: Net = Import + CustomerReturn - StockReturn - Sales`);
      console.log(`   Message: ${result.message}`);
    } else {
      console.log('\n❌ RECALCULATION FAILED');
      console.log(`   Error: ${result.error}`);
    }

    return result;

  } catch (error) {
    console.error('❌ Error during recalculation:', error.message);
    throw error;
  }
}

async function verifyResults() {
  try {
    console.log('\n\n' + '='.repeat(100));
    console.log(' 🔍 VERIFICATION - CHECKING SAMPLE RESULTS');
    console.log('='.repeat(100));

    const inventoryResult = await shopInventoryService.getInventory({ hideZeroStock: false });
    
    if (!inventoryResult.success) {
      console.log('❌ Failed to load inventory for verification');
      return;
    }

    const inventory = inventoryResult.data;
    console.log(`\n📊 Total inventory records: ${inventory.length}`);

    // Find records with returns
    const recordsWithReturns = inventory.filter(r => r.customerReturn > 0 || r.stockReturn > 0);
    console.log(`📋 Records with returns: ${recordsWithReturns.length}`);

    if (recordsWithReturns.length > 0) {
      console.log('\n📋 SAMPLE RECORDS WITH RETURNS (First 10):');
      console.log('─'.repeat(100));
      recordsWithReturns.slice(0, 10).forEach((r, i) => {
        console.log(`\n${i + 1}. ${r.designNumber} | ${r.color} | ${r.size}`);
        console.log(`   Import: ${r.import}`);
        console.log(`   Customer Return: +${r.customerReturn} (ADDED)`);
        console.log(`   Stock Return: -${r.stockReturn} (SUBTRACTED)`);
        console.log(`   Sales: ${r.sales}`);
        console.log(`   → Net: ${r.import} + ${r.customerReturn} - ${r.stockReturn} - ${r.sales} = ${r.net}`);
        
        // Verify calculation
        const expectedNet = r.import + r.customerReturn - r.stockReturn - r.sales;
        const isCorrect = r.net === expectedNet;
        console.log(`   ✓ Calculation: ${isCorrect ? '✅ CORRECT' : '❌ WRONG'}`);
      });
    }

    // Statistics
    console.log('\n\n📊 INVENTORY STATISTICS:');
    console.log('─'.repeat(100));
    const totalNet = inventory.reduce((sum, r) => sum + r.net, 0);
    const totalImport = inventory.reduce((sum, r) => sum + r.import, 0);
    const totalSales = inventory.reduce((sum, r) => sum + r.sales, 0);
    const totalCustomerReturn = inventory.reduce((sum, r) => sum + r.customerReturn, 0);
    const totalStockReturn = inventory.reduce((sum, r) => sum + r.stockReturn, 0);

    console.log(`   Total Import: ${totalImport}`);
    console.log(`   Total Customer Returns: +${totalCustomerReturn} (ADDED)`);
    console.log(`   Total Stock Returns: -${totalStockReturn} (SUBTRACTED)`);
    console.log(`   Total Sales: ${totalSales}`);
    console.log(`   ────────────────────────────────`);
    console.log(`   Net Inventory: ${totalNet}`);
    
    const calculatedNet = totalImport + totalCustomerReturn - totalStockReturn - totalSales;
    console.log(`   Expected Net: ${totalImport} + ${totalCustomerReturn} - ${totalStockReturn} - ${totalSales} = ${calculatedNet}`);
    console.log(`   Match: ${totalNet === calculatedNet ? '✅ YES' : '❌ NO'}`);

  } catch (error) {
    console.error('❌ Error verifying results:', error.message);
    throw error;
  }
}

async function main() {
  try {
    // Step 1: Analyze current data
    const stats = await analyzeData();

    // Step 2: Recalculate inventory
    const recalcResult = await recalculateInventory();

    // Step 3: Verify results
    if (recalcResult.success) {
      await verifyResults();
    }

    console.log('\n\n' + '='.repeat(100));
    console.log(' ✅ INVENTORY RECALCULATION COMPLETE');
    console.log('='.repeat(100));
    console.log('\n📝 SUMMARY:');
    console.log(`   ✓ Processed ${stats.totalImports} import transactions`);
    console.log(`   ✓ Processed ${stats.totalSales} sales transactions`);
    console.log(`   ✓ Processed ${stats.totalCustomerReturns} customer return transactions (ADDED)`);
    console.log(`   ✓ Processed ${stats.totalStockReturns} stock return transactions (SUBTRACTED)`);
    console.log(`   ✓ Generated inventory for all items`);
    console.log('\n🎯 The current calculation formula has been applied to ALL historical data!');
    console.log('   Formula: Net = Import + CustomerReturn - StockReturn - Sales\n');

  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from database\n');
  }
}

// Run the script
main();
