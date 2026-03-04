#!/usr/bin/env node
import mongoose from 'mongoose';
import { getTransactionModel } from './models/Transaction.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-management';

async function restoreStockReturned() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    console.log('\n' + '='.repeat(80));
    console.log('🔄 RESTORING STOCK RETURNED DATA');
    console.log('='.repeat(80));
    
    // Get valid stock return transactions
    const ShopReturn = getTransactionModel('shop', '', 'return');
    const stockReturnTransactions = await ShopReturn.find({ channel: 'domestic return' }).lean();
    
    console.log(`\n📥 Found ${stockReturnTransactions.length} valid stock return transactions\n`);
    
    // Clear existing StockReturned collection
    const StockReturned = mongoose.model('StockReturned', new mongoose.Schema({}, { strict: false, collection: 'stockreturneds' }));
    const deleteResult = await StockReturned.deleteMany({});
    console.log(`🧹 Cleared existing entries: ${deleteResult.deletedCount}\n`);
    
    // Convert transactions to StockReturned documents
    const documentsToInsert = stockReturnTransactions.map(transaction => ({
      dno: transaction.dno,
      color: transaction.color,
      size: transaction.size,
      qty: transaction.qty,
      date: transaction.date || new Date(),
      channel: transaction.channel,
      createdAt: transaction.createdAt || new Date(),
      updatedAt: transaction.updatedAt || new Date()
    }));
    
    // Insert all documents
    const insertResult = await StockReturned.insertMany(documentsToInsert);
    console.log(`✅ Restored ${insertResult.length} stock returned entries\n`);
    
    // Show sample restored entries
    console.log('📋 Sample restored entries:');
    insertResult.slice(0, 5).forEach((doc, i) => {
      console.log(`   ${i+1}. DNO: ${doc.dno}, Color: ${doc.color}, Size: ${doc.size}, Qty: ${doc.qty}`);
    });
    if (insertResult.length > 5) {
      console.log(`   ... and ${insertResult.length - 5} more\n`);
    } else {
      console.log('');
    }
    
    // Recalculate inventory
    console.log('📊 Recalculating inventory...');
    const { default: shopInventoryService } = await import('./services/shopInventory.service.js');
    await shopInventoryService.calculateInventory();
    console.log('✅ Inventory recalculated!\n');
    
    console.log('='.repeat(80));
    console.log('✅ RESTORATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`• Restored ${insertResult.length} stock returned entries`);
    console.log('• Recalculated shop inventory');
    console.log('• Data is back and working!\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

restoreStockReturned();
