/**
 * Cleanup script to remove old dispatch entries created by purchase orders
 * that don't have the receiver field (PO_xxx)
 * 
 * These are legacy entries created before we implemented proper tracking.
 * Run this once to clean up the database.
 */

import mongoose from 'mongoose';
import PurchaseOrder from './models/PurchaseOrder.js';
import { getTransactionModel } from './models/Transaction.js';

// MongoDB connection string - update this to match your environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-management';

async function cleanupPODispatchEntries() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const DispatchModel = getTransactionModel('warehouse', 'domestic', 'dispatch');
    
    // Get all purchase orders
    const purchaseOrders = await PurchaseOrder.find({}).lean();
    console.log(`Found ${purchaseOrders.length} purchase orders\n`);

    let totalDeleted = 0;
    
    for (const po of purchaseOrders) {
      console.log(`\nProcessing PO ${po._id} (${po.dealerName})...`);
      console.log(`  Date: ${po.date}`);
      console.log(`  Items: ${po.items.length}`);
      
      // For each item in the PO, find and delete matching dispatch entries
      // that don't have a receiver field (legacy entries)
      for (const item of po.items) {
        const query = {
          domain: 'warehouse',
          warehouseType: 'domestic',
          formType: 'dispatch',
          dno: item.designNumber,
          color: item.color,
          date: po.date,
          $or: [
            { receiver: { $exists: false } },
            { receiver: '' },
            { receiver: null }
          ]
        };
        
        // Find matching entries first
        const matchingEntries = await DispatchModel.find(query).lean();
        
        if (matchingEntries.length > 0) {
          console.log(`  Found ${matchingEntries.length} legacy entries for ${item.designNumber}-${item.color}:`);
          matchingEntries.forEach(entry => {
            console.log(`    - ${entry.dno}-${entry.color} ${entry.size} x${entry.qty}`);
          });
          
          // Delete them
          const result = await DispatchModel.deleteMany(query);
          console.log(`  ✓ Deleted ${result.deletedCount} entries`);
          totalDeleted += result.deletedCount;
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Cleanup complete!`);
    console.log(`   Total legacy dispatch entries deleted: ${totalDeleted}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run the cleanup
console.log('='.repeat(60));
console.log('PO Dispatch Entries Cleanup Script');
console.log('='.repeat(60));
console.log('\nThis script will delete old dispatch entries that were');
console.log('created by purchase orders but lack proper tracking.\n');
console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

setTimeout(() => {
  cleanupPODispatchEntries();
}, 3000);
