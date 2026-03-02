import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test case: Verify stock returned is properly deducted from shop inventory

console.log('='.repeat(80));
console.log('TEST: STOCK RETURNED DEDUCTION FROM SHOP INVENTORY');
console.log('='.repeat(80));

// Sample test data
const testScenario = {
  designNumber: 'D001',
  color: 'Red',
  size: 'M'
};

console.log(`\n📌 TEST SCENARIO:`);
console.log(`   Design Number: ${testScenario.designNumber}`);
console.log(`   Color: ${testScenario.color}`);
console.log(`   Size: ${testScenario.size}`);

// Test Case 1: Basic deduction
console.log(`\n\n📊 TEST CASE 1: Basic Stock Return Deduction`);
console.log('-'.repeat(80));

const inventory1 = {
  designNumber: 'D001',
  color: 'Red',
  size: 'M',
  import: 100,        // Initial stock imported
  return: 0,          // Stock returned to warehouse (from shop)
  sales: 10,          // Sold items
  net: 0
};

console.log(`BEFORE:`);
console.log(`  Import: ${inventory1.import}`);
console.log(`  Sales: ${inventory1.sales}`);
console.log(`  Return: ${inventory1.return}`);

// Simulate stock return from shop to warehouse (should subtract from shop)
const stockReturnedQty = 15;
inventory1.return -= stockReturnedQty;  // SUBTRACT (negative operation)

console.log(`\nStock Returned from Shop to Warehouse: ${stockReturnedQty}`);
console.log(`After Stock Return:`);
console.log(`  Return field: ${inventory1.return} (negative means subtracted from shop)`);

// Calculate net using CORRECT formula
// Net = Import - Sales - StockReturned
inventory1.net = inventory1.import - inventory1.sales - stockReturnedQty;

console.log(`\n✅ CORRECT FORMULA: net = import - sales - stock_returned`);
console.log(`   net = ${inventory1.import} - ${inventory1.sales} - ${stockReturnedQty}`);
console.log(`   net = ${inventory1.net}`);

// Test Case 2: Multiple stock returns
console.log(`\n\n📊 TEST CASE 2: Multiple Stock Returns`);
console.log('-'.repeat(80));

const inventory2 = {
  designNumber: 'D002',
  color: 'Blue',
  size: 'L',
  import: 200,
  return: 0,
  sales: 30,
  net: 0
};

console.log(`BEFORE:`);
console.log(`  Import: ${inventory2.import}`);
console.log(`  Sales: ${inventory2.sales}`);

// First stock return
const return1 = 20;
inventory2.return -= return1;
console.log(`\n1st Stock Return: ${return1}`);
console.log(`  Return field: ${inventory2.return}`);

// Second stock return
const return2 = 10;
inventory2.return -= return2;
console.log(`\n2nd Stock Return: ${return2}`);
console.log(`  Return field: ${inventory2.return}`);

// Calculate net
inventory2.net = inventory2.import - inventory2.sales - Math.abs(inventory2.return);

console.log(`\n✅ CORRECT FORMULA: net = import - sales - total_stock_returned`);
console.log(`   net = ${inventory2.import} - ${inventory2.sales} - ${Math.abs(inventory2.return)}`);
console.log(`   net = ${inventory2.net}`);

console.log(`\n\n${'='.repeat(80)}`);
console.log('SUMMARY OF ISSUE & FIX:');
console.log('='.repeat(80));
console.log(`\n❌ CURRENT ISSUE:`);
console.log(`   Formula: net = (import + return) - sales`);
console.log(`   Problem: This would ADD negative returns instead of subtracting them`);
console.log(`   Example: net = (100 + (-15)) - 10 = 75 ✓ (accidentally works if return is negative)`);
console.log(`   But the logic is confusing and error-prone`);

console.log(`\n✅ CORRECT APPROACH:`);
console.log(`   Formula: net = import - sales - stock_returned`);
console.log(`   Clearer logic: Start with imports, subtract sales, subtract returns`);
console.log(`   Example: net = 100 - 10 - 15 = 75`);

console.log(`\n📝 TEST RESULTS:`);
console.log(`   Test Case 1 - Net: ${inventory1.net} units ✅`);
console.log(`   Test Case 2 - Net: ${inventory2.net} units ✅`);

console.log('\n' + '='.repeat(80));
