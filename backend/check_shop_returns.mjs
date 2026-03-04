#!/usr/bin/env node
import mongoose from 'mongoose';
import { getTransactionModel } from './models/Transaction.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-management';

async function checkTransactions() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const ShopReturn = getTransactionModel('shop', '', 'return');
    
    const stockReturns = await ShopReturn.find({ channel: 'domestic return' }).lean();
    const allReturns = await ShopReturn.find({}).lean();
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 SHOP RETURN TRANSACTIONS');
    console.log('='.repeat(80));
    console.log(`Total shop_return transactions: ${allReturns.length}`);
    console.log(`Stock return transactions (channel='domestic return'): ${stockReturns.length}\n`);
    
    if (stockReturns.length > 0) {
      console.log('✅ Valid stock return transactions still exist:');
      stockReturns.slice(0, 5).forEach((t, i) => {
        console.log(`${i+1}. DNO: ${t.dno}, Color: ${t.color}, Size: ${t.size}, Qty: ${t.qty}`);
      });
      if (stockReturns.length > 5) console.log(`... and ${stockReturns.length - 5} more`);
    } else {
      console.log('❌ No valid stock return transactions found');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTransactions();
