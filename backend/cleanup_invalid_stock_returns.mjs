#!/usr/bin/env node
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-management';

async function cleanupAndRecalculate() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    console.log('\n' + '='.repeat(80));
    console.log('🧹 CLEANING UP INVALID STOCK RETURNED ENTRIES');
    console.log('='.repeat(80));
    
    const StockReturned = mongoose.model('StockReturned', new mongoose.Schema({}, { strict: false, collection: 'stockreturneds' }));
    
    // Find all entries with invalid size or qty
    const invalidEntries = await StockReturned.find({
      $or: [
        { size: { $in: ['undefined', null, ''] } },
        { qty: { $in: [undefined, null, 'undefined', ''] } },
        { size: { $exists: false } },
        { qty: { $exists: false } }
      ]
    }).lean();
    
    console.log(`\nFound ${invalidEntries.length} invalid entries`);
    
    // Get unique design numbers before deletion
    const affectedDNOs = [...new Set(invalidEntries.map(e => e.dno))].sort();
    console.log(`Affecting ${affectedDNOs.length} unique design numbers\n`);
    
    // Delete invalid entries
    const deleteResult = await StockReturned.deleteMany({
      $or: [
        { size: { $in: ['undefined', null, ''] } },
        { qty: { $in: [undefined, null, 'undefined', ''] } },
        { size: { $exists: false } },
        { qty: { $exists: false } }
      ]
    });
    
    console.log(`✅ Deleted ${deleteResult.deletedCount} invalid entries\n`);
    
    // Also delete corresponding shop_return transactions with channel='domestic return' that have invalid data
    const getTransactionModel = (domain, warehouseType, formType) => {
      const collectionName = `${domain}_${formType}`;
      return mongoose.model(collectionName, new mongoose.Schema({}, { strict: false, collection: collectionName + 's' }));
    };
    
    const ShopReturn = getTransactionModel('shop', '', 'return');
    
    const invalidTransactions = await ShopReturn.find({
      channel: 'domestic return',
      $or: [
        { size: { $in: ['undefined', null, ''] } },
        { qty: { $in: [undefined, null, 'undefined', ''] } },
        { size: { $exists: false } },
        { qty: { $exists: false } }
      ]
    }).lean();
    
    console.log(`Found ${invalidTransactions.length} invalid shop_return transactions`);
    
    const deleteTransResult = await ShopReturn.deleteMany({
      channel: 'domestic return',
      $or: [
        { size: { $in: ['undefined', null, ''] } },
        { qty: { $in: [undefined, null, 'undefined', ''] } },
        { size: { $exists: false } },
        { qty: { $exists: false } }
      ]
    });
    
    console.log(`✅ Deleted ${deleteTransResult.deletedCount} invalid shop_return transactions\n`);
    
    // Save list of affected DNOs to file for reference
    const affectedDNOsFile = path.join(process.cwd(), 'affected_dnos.json');
    await fs.writeFile(affectedDNOsFile, JSON.stringify(affectedDNOs, null, 2));
    console.log(`📝 Saved affected DNOs to: ${affectedDNOsFile}\n`);
    
    console.log('='.repeat(80));
    console.log('📊 RECALCULATING SHOP INVENTORY');
    console.log('='.repeat(80));
    
    // Import and run the shop inventory calculation
    const { default: shopInventoryService } = await import('./services/shopInventory.service.js');
    
    console.log('\nRecalculating inventory for all design numbers...');
    await shopInventoryService.calculateInventory();
    console.log('✅ Inventory recalculation complete!\n');
    
    console.log('='.repeat(80));
    console.log('✅ CLEANUP AND RECALCULATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`• Deleted ${deleteResult.deletedCount} invalid StockReturned entries`);
    console.log(`• Deleted ${deleteTransResult.deletedCount} invalid shop_return transactions`);
    console.log(`• Recalculated inventory for all design numbers`);
    console.log(`• Affected ${affectedDNOs.length} unique design numbers`);
    console.log('\nNote: All invalid stock return entries have been removed.');
    console.log('To create proper stock returns, use the stock-returned page with valid size and qty values.\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupAndRecalculate();
