#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-management';

async function checkAllStockReturned() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const StockReturned = mongoose.model('StockReturned', new mongoose.Schema({}, { strict: false, collection: 'stockreturneds' }));
    
    const allEntries = await StockReturned.find({}).lean();
    
    console.log('\n' + '='.repeat(80));
    console.log('📦 ALL STOCK RETURNED ENTRIES');
    console.log('='.repeat(80));
    console.log(`Total entries: ${allEntries.length}\n`);
    
    const issues = [];
    const uniqueDNOs = new Set();
    
    allEntries.forEach((entry, i) => {
      uniqueDNOs.add(entry.dno);
      
      const hasIssues = [];
      if (!entry.dno || entry.dno === 'undefined') hasIssues.push('Missing/Invalid DNO');
      if (!entry.color || entry.color === 'undefined') hasIssues.push('Missing/Invalid Color');
      if (!entry.size || entry.size === 'undefined') hasIssues.push('Missing/Invalid Size');
      if (!entry.qty || entry.qty === undefined || entry.qty === 'undefined') hasIssues.push('Missing/Invalid Qty');
      
      console.log(`Entry ${i + 1}:`);
      console.log(`   _id: ${entry._id}`);
      console.log(`   DNO: "${entry.dno}"`);
      console.log(`   Color: "${entry.color}"`);
      console.log(`   Size: "${entry.size}"`);
      console.log(`   Qty: ${entry.qty}`);
      console.log(`   Date: ${entry.date ? new Date(entry.date).toISOString().split('T')[0] : 'N/A'}`);
      
      if (hasIssues.length > 0) {
        console.log(`   ⚠️  ISSUES: ${hasIssues.join(', ')}`);
        issues.push({ entry, issues: hasIssues });
      } else {
        console.log(`   ✅ Valid entry`);
      }
      console.log('');
    });
    
    console.log('='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total entries: ${allEntries.length}`);
    console.log(`Entries with issues: ${issues.length}`);
    console.log(`Valid entries: ${allEntries.length - issues.length}`);
    console.log(`Unique design numbers: ${uniqueDNOs.size}`);
    console.log('');
    
    console.log('Design numbers to recalculate:');
    Array.from(uniqueDNOs).sort().forEach(dno => {
      console.log(`   - ${dno}`);
    });
    console.log('');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllStockReturned();
