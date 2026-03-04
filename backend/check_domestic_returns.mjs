#!/usr/bin/env node
import mongoose from 'mongoose';
import { getTransactionModel } from './models/Transaction.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-management';

async function checkDomesticReturns() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    console.log('\n' + '='.repeat(80));
    console.log('🏭 CHECKING DOMESTIC WAREHOUSE RETURNS');
    console.log('='.repeat(80));
    
    // Check DomesticReturn collection (if it exists)
    const DomesticReturn = getTransactionModel('domestic', '', 'return');
    
    const allDomesticReturns = await DomesticReturn.find({}).lean();
    const validEntries = allDomesticReturns.filter(e => e.dno && e.size && e.size !== 'undefined' && e.qty !== undefined);
    const invalidEntries = allDomesticReturns.filter(e => !e.dno || !e.size || e.size === 'undefined' || e.qty === undefined);
    
    console.log(`\n📊 DOMESTIC RETURN TRANSACTIONS:`);
    console.log(`   Total entries: ${allDomesticReturns.length}`);
    console.log(`   Valid entries: ${validEntries.length}`);
    console.log(`   Invalid/corrupt entries: ${invalidEntries.length}\n`);
    
    if (invalidEntries.length > 0) {
      console.log('⚠️  FOUND CORRUPT DOMESTIC RETURN ENTRIES!\n');
      console.log('Sample corrupt entries:');
      invalidEntries.slice(0, 5).forEach((e, i) => {
        console.log(`${i+1}. DNO: ${e.dno}, Color: ${e.color}, Size: ${e.size}, Qty: ${e.qty}`);
      });
      if (invalidEntries.length > 5) {
        console.log(`... and ${invalidEntries.length - 5} more`);
      }
    } else {
      console.log('✅ All domestic return entries are valid\n');
      console.log('Sample entries:');
      validEntries.slice(0, 5).forEach((e, i) => {
        console.log(`${i+1}. DNO: ${e.dno}, Color: ${e.color}, Size: ${e.size}, Qty: ${e.qty}`);
      });
      if (validEntries.length > 5) {
        console.log(`... and ${validEntries.length - 5} more`);
      }
    }
    
    // Check if domestic inventory is being calculated
    console.log('\n' + '='.repeat(80));
    console.log('🏭 DOMESTIC WAREHOUSE INVENTORY STATUS');
    console.log('='.repeat(80));
    
    const DomesticImport = getTransactionModel('domestic', '', 'import');
    const DomesticSales = getTransactionModel('domestic', '', 'sales');
    
    const imports = await DomesticImport.countDocuments();
    const sales = await DomesticSales.countDocuments();
    const returns = await DomesticReturn.countDocuments();
    
    console.log(`\n📦 DOMESTIC TRANSACTIONS:`);
    console.log(`   Imports: ${imports}`);
    console.log(`   Sales: ${sales}`);
    console.log(`   Returns: ${returns}\n`);
    
    if (returns > 0 && invalidEntries.length > 0) {
      console.log('⚠️  ACTION NEEDED: Clean up corrupt domestic return entries\n');
    } else if (returns > 0) {
      console.log('✅ Domestic returns are valid and being tracked\n');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDomesticReturns();
