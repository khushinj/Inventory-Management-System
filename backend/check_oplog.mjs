#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-management';

async function checkOplog() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 CHECKING MONGODB OPLOG FOR DELETED ENTRIES');
    console.log('='.repeat(80));
    
    try {
      // Try to access the oplog (only works on replica sets)
      const oplogCollection = db.collection('oplog.rs');
      const deletionOps = await oplogCollection.find({
        op: 'd',  // delete operation
        ns: 'inventory-management.stockreturneds'
      }).toArray();
      
      if (deletionOps.length > 0) {
        console.log(`\n✅ Found ${deletionOps.length} deletion operations in oplog!\n`);
        console.log('Most recent deletions:');
        deletionOps.slice(-5).forEach((op, i) => {
          console.log(`${i+1}. Timestamp: ${new Date(op.ts.toNumber() * 1000)}`);
          console.log(`   Operation: ${JSON.stringify(op.o)}`);
        });
        console.log('\n✅ Good news! Deletions are logged. We can recover them.');
      } else {
        console.log('\n❌ No deletion operations found in oplog (may have been cleaned up)');
      }
    } catch (oplogError) {
      console.log('\n⚠️  Oplog not available (not a replica set or access denied)');
      console.log('   Oplog is only available on MongoDB replica sets\n');
    }
    
    // Check if there's a local backup directory
    console.log('🔍 Looking for MongoDB backups...\n');
    console.log('MongoDB data location: Usually at /data/db or /var/lib/mongodb');
    console.log('Backup commands to try:');
    console.log('  1. Check if MongoDB is running as a replica set');
    console.log('  2. mongodump to export the database');
    console.log('  3. Check cloud provider backups\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkOplog();
