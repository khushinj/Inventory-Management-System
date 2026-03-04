#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-management';

async function checkStockReturned() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const dno = 'NGW-351120';
    
    // Check StockReturned collection
    const StockReturned = mongoose.model('StockReturned', new mongoose.Schema({}, { strict: false, collection: 'stockreturneds' }));
    
    const entries = await StockReturned.find({ dno: { $regex: new RegExp(dno, 'i') } }).lean();
    
    console.log('\n' + '='.repeat(80));
    console.log('📦 STOCK RETURNED COLLECTION ENTRIES FOR: ' + dno);
    console.log('='.repeat(80));
    console.log('Total entries found: ' + entries.length + '\n');
    
    if (entries.length === 0) {
      console.log('❌ No stock return entries found in StockReturned collection.');
      console.log('   This means either:');
      console.log('   1. The entry was deleted');
      console.log('   2. The DNO is normalized differently');
      console.log('   3. The entry never existed\n');
    } else {
      entries.forEach((entry, i) => {
        console.log(`Entry ${i+1}:`);
        console.log(`   _id: ${entry._id}`);
        console.log(`   DNO: "${entry.dno}"`);
        console.log(`   Color: "${entry.color}"`);
        console.log(`   Size: "${entry.size}"`);
        console.log(`   Qty: ${entry.qty}`);
        console.log(`   Date: ${entry.date}`);
        console.log(`   Created: ${entry.createdAt}`);
        console.log('');
      });
    }
    
    // Also search for variations
    console.log('🔍 Searching for variations...\n');
    const variations = await StockReturned.find({ dno: { $regex: /351120/i } }).lean();
    
    if (variations.length > 0) {
      console.log(`Found ${variations.length} entries containing "351120":\n`);
      variations.forEach((v, i) => {
        console.log(`${i+1}. DNO: "${v.dno}", Color: "${v.color}", Size: "${v.size}", Qty: ${v.qty}`);
      });
    } else {
      console.log('❌ No entries found containing "351120"');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStockReturned();
