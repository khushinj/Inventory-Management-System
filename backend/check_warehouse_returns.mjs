#!/usr/bin/env node
import mongoose from 'mongoose';
import { getTransactionModel } from './models/Transaction.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-management';

async function checkWarehouseReturns() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    console.log('\n' + '='.repeat(80));
    console.log('🏭 CHECKING WAREHOUSE RETURNS');
    console.log('='.repeat(80));
    
    // Try different collection names
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const warehouseCollections = collections.filter(c => c.name.includes('warehouse') || c.name.includes('domestic')).map(c => c.name);
    
    console.log(`\nWarehouse-related collections found: ${warehouseCollections.length}\n`);
    warehouseCollections.forEach(name => {
      console.log(`   - ${name}`);
    });
    
    // Check warehouse_return collection
    console.log('\n' + '='.repeat(80));
    console.log('📦 WAREHOUSE_RETURN COLLECTION');
    console.log('='.repeat(80));
    
    const WarehouseReturn = getTransactionModel('warehouse', 'domestic', 'return');
    const warehouseReturns = await WarehouseReturn.find({}).lean();
    
    const validEntries = warehouseReturns.filter(e => e.dno && e.size && e.size !== 'undefined' && e.qty !== undefined);
    const invalidEntries = warehouseReturns.filter(e => !e.dno || !e.size || e.size === 'undefined' || e.qty === undefined);
    
    console.log(`\nTotal warehouse_return entries: ${warehouseReturns.length}`);
    console.log(`Valid entries: ${validEntries.length}`);
    console.log(`Invalid/corrupt entries: ${invalidEntries.length}\n`);
    
    if (invalidEntries.length > 0) {
      console.log('⚠️  FOUND CORRUPT WAREHOUSE RETURN ENTRIES:\n');
      invalidEntries.slice(0, 10).forEach((e, i) => {
        console.log(`${i+1}. DNO: ${e.dno}, Color: ${e.color}, Size: ${e.size}, Qty: ${e.qty}`);
      });
      if (invalidEntries.length > 10) {
        console.log(`... and ${invalidEntries.length - 10} more`);
      }
    } else if (warehouseReturns.length > 0) {
      console.log('✅ All warehouse return entries are valid\n');
      console.log('Sample entries:');
      validEntries.slice(0, 5).forEach((e, i) => {
        console.log(`${i+1}. DNO: ${e.dno}, Color: ${e.color}, Size: ${e.size}, Qty: ${e.qty}`);
      });
      if (validEntries.length > 5) {
        console.log(`... and ${validEntries.length - 5} more`);
      }
    } else {
      console.log('❌ No warehouse return entries found');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkWarehouseReturns();
