#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-management';

async function checkStockReturned() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const StockReturned = mongoose.model('StockReturned', new mongoose.Schema({}, { strict: false, collection: 'stockreturneds' }));
    
    const count = await StockReturned.countDocuments();
    const entries = await StockReturned.find({}).lean();
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 CURRENT STOCK RETURNED ENTRIES');
    console.log('='.repeat(80));
    console.log(`Total entries: ${count}\n`);
    
    if (entries.length === 0) {
      console.log('❌ NO ENTRIES FOUND - Data was deleted');
    } else {
      entries.slice(0, 10).forEach((entry, i) => {
        console.log(`${i+1}. DNO: ${entry.dno}, Color: ${entry.color}, Size: ${entry.size}, Qty: ${entry.qty}`);
      });
      if (entries.length > 10) console.log(`... and ${entries.length - 10} more`);
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStockReturned();
