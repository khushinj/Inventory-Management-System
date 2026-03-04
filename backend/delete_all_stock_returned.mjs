#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-management';

async function deleteAllStockReturned() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    console.log('\n' + '='.repeat(80));
    console.log('🗑️  DELETING ALL STOCK RETURNED DATA');
    console.log('='.repeat(80));
    
    const StockReturned = mongoose.model('StockReturned', new mongoose.Schema({}, { strict: false, collection: 'stockreturneds' }));
    
    // Count before deletion
    const countBefore = await StockReturned.countDocuments();
    console.log(`\n📊 Before deletion: ${countBefore} entries\n`);
    
    // Delete all
    const deleteResult = await StockReturned.deleteMany({});
    
    console.log(`✅ Deleted ${deleteResult.deletedCount} entries\n`);
    
    // Verify deletion
    const countAfter = await StockReturned.countDocuments();
    console.log(`📊 After deletion: ${countAfter} entries\n`);
    
    // Recalculate inventory
    console.log('📊 Recalculating shop inventory...');
    const { default: shopInventoryService } = await import('./services/shopInventory.service.js');
    await shopInventoryService.calculateInventory();
    console.log('✅ Inventory recalculated!\n');
    
    console.log('='.repeat(80));
    console.log('✅ DELETION COMPLETE');
    console.log('='.repeat(80));
    console.log(`• Deleted ${deleteResult.deletedCount} stock returned entries`);
    console.log('• Recalculated shop inventory');
    console.log('• Note: shop_return & warehouse_domestic_return transactions remain intact\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteAllStockReturned();
