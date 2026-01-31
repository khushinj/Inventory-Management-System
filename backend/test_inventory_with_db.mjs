import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getTransactionModel } from './models/Transaction.js';
import shopInventoryService from './services/shopInventory.service.js';

dotenv.config();

async function testInventoryCalculation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check what's in the database
    const salesModel = getTransactionModel('shop', '', 'sales');
    const importModel = getTransactionModel('shop', '', 'import');
    const returnModel = getTransactionModel('shop', '', 'return');

    const salesCount = await salesModel.countDocuments();
    const importCount = await importModel.countDocuments();
    const returnCount = await returnModel.countDocuments();

    console.log('📊 Database Transactions:');
    console.log(`   Sales: ${salesCount} entries`);
    console.log(`   Import: ${importCount} entries`);
    console.log(`   Return: ${returnCount} entries`);

    if (salesCount > 0) {
      const sample = await salesModel.findOne().lean();
      console.log('\n   Sample sales entry:', JSON.stringify(sample, null, 2));
    }

    console.log('\n🔄 Recalculating inventory...\n');

    // Recalculate inventory
    const result = await shopInventoryService.calculateInventory();

    console.log('\n✅ Calculation complete!');
    console.log('   Total records:', result.totalRecords);
    console.log('   Success:', result.success);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testInventoryCalculation();
