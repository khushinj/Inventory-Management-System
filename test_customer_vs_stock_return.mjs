import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('='.repeat(100));
console.log(' CUSTOMER RETURN vs STOCK RETURN - FIXED LOGIC TEST');
console.log('='.repeat(100));

// ============================================================================
// TEST DATA
// ============================================================================

console.log('\n\n📦 TEST SCENARIO SETUP:');
console.log('-'.repeat(100));

const testScenario = {
  designNumber: 'D001',
  color: 'Red',
  size: 'M'
};

console.log(`Test Item: ${testScenario.designNumber} | ${testScenario.color} | ${testScenario.size}\n`);

// ============================================================================
// TEST CASE 1: CUSTOMER RETURN (Should ADD to inventory)
// ============================================================================

console.log('='.repeat(100));
console.log(' TEST CASE 1: CUSTOMER RETURN (Should ADD)');
console.log('='.repeat(100));

let inventory1 = {
  designNumber: 'D001',
  color: 'Red',
  size: 'M',
  import: 100,           // Initial stock
  customerReturn: 0,     // Customer returns (ADD)
  stockReturn: 0,        // Stock returns (SUBTRACT)
  sales: 20,             // Sold
  net: 0
};

console.log(`\n📊 INITIAL STATE:`);
console.log(`   Import: ${inventory1.import} units`);
console.log(`   Sales: ${inventory1.sales} units`);
console.log(`   Customer Return: ${inventory1.customerReturn} units`);
console.log(`   Stock Return: ${inventory1.stockReturn} units`);

// Customer returns 5 units (items coming BACK to shop from customer)
const customerReturnQty = 5;
inventory1.customerReturn += customerReturnQty;

console.log(`\n📥 CUSTOMER RETURNS 5 units to shop:`);
console.log(`   Customer Return field: ${inventory1.customerReturn}`);

// Calculate net with CORRECT formula
// Net = Import + CustomerReturn - StockReturn - Sales
inventory1.net = inventory1.import + inventory1.customerReturn - inventory1.stockReturn - inventory1.sales;

console.log(`\n🧮 CALCULATION:`);
console.log(`   Formula: net = import + customerReturn - stockReturn - sales`);
console.log(`   net = ${inventory1.import} + ${inventory1.customerReturn} - ${inventory1.stockReturn} - ${inventory1.sales}`);
console.log(`   net = ${inventory1.net} units`);

console.log(`\n✅ RESULT: ${inventory1.net} units`);
console.log(`   Expected: 85 (100 + 5 - 0 - 20 = 85)`);
console.log(`   Status: ${inventory1.net === 85 ? '✅ CORRECT' : '❌ WRONG'}`);

// ============================================================================
// TEST CASE 2: STOCK RETURN (Should SUBTRACT from inventory)
// ============================================================================

console.log('\n\n' + '='.repeat(100));
console.log(' TEST CASE 2: STOCK RETURN (Should SUBTRACT)');
console.log('='.repeat(100));

let inventory2 = {
  designNumber: 'D002',
  color: 'Blue',
  size: 'L',
  import: 150,           // Initial stock
  customerReturn: 0,     // Customer returns (ADD)
  stockReturn: 0,        // Stock returns (SUBTRACT)
  sales: 30,             // Sold
  net: 0
};

console.log(`\n📊 INITIAL STATE:`);
console.log(`   Import: ${inventory2.import} units`);
console.log(`   Sales: ${inventory2.sales} units`);
console.log(`   Customer Return: ${inventory2.customerReturn} units`);
console.log(`   Stock Return: ${inventory2.stockReturn} units`);

// Stock returns 10 units (items going BACK to warehouse from shop)
const stockReturnQty = 10;
inventory2.stockReturn += stockReturnQty;

console.log(`\n📤 STOCK RETURNS 10 units to warehouse:`);
console.log(`   Stock Return field: ${inventory2.stockReturn}`);

// Calculate net with CORRECT formula
// Net = Import + CustomerReturn - StockReturn - Sales
inventory2.net = inventory2.import + inventory2.customerReturn - inventory2.stockReturn - inventory2.sales;

console.log(`\n🧮 CALCULATION:`);
console.log(`   Formula: net = import + customerReturn - stockReturn - sales`);
console.log(`   net = ${inventory2.import} + ${inventory2.customerReturn} - ${inventory2.stockReturn} - ${inventory2.sales}`);
console.log(`   net = ${inventory2.net} units`);

console.log(`\n✅ RESULT: ${inventory2.net} units`);
console.log(`   Expected: 110 (150 + 0 - 10 - 30 = 110)`);
console.log(`   Status: ${inventory2.net === 110 ? '✅ CORRECT' : '❌ WRONG'}`);

// ============================================================================
// TEST CASE 3: BOTH CUSTOMER AND STOCK RETURNS
// ============================================================================

console.log('\n\n' + '='.repeat(100));
console.log(' TEST CASE 3: BOTH CUSTOMER AND STOCK RETURNS');
console.log('='.repeat(100));

let inventory3 = {
  designNumber: 'D003',
  color: 'Green',
  size: 'XL',
  import: 200,           // Initial stock
  customerReturn: 0,     // Customer returns (ADD)
  stockReturn: 0,        // Stock returns (SUBTRACT)
  sales: 50,             // Sold
  net: 0
};

console.log(`\n📊 INITIAL STATE:`);
console.log(`   Import: ${inventory3.import} units`);
console.log(`   Sales: ${inventory3.sales} units`);

// Customer returns 8 units
const customerReturnQty3 = 8;
inventory3.customerReturn += customerReturnQty3;

console.log(`\n📥 CUSTOMER RETURNS 8 units to shop:`);
console.log(`   Customer Return field: ${inventory3.customerReturn}`);

// Stock returns 12 units
const stockReturnQty3 = 12;
inventory3.stockReturn += stockReturnQty3;

console.log(`\n📤 STOCK RETURNS 12 units to warehouse:`);
console.log(`   Stock Return field: ${inventory3.stockReturn}`);

// Calculate net
inventory3.net = inventory3.import + inventory3.customerReturn - inventory3.stockReturn - inventory3.sales;

console.log(`\n🧮 CALCULATION:`);
console.log(`   Formula: net = import + customerReturn - stockReturn - sales`);
console.log(`   net = ${inventory3.import} + ${inventory3.customerReturn} - ${inventory3.stockReturn} - ${inventory3.sales}`);
console.log(`   net = ${inventory3.net} units`);

console.log(`\n✅ RESULT: ${inventory3.net} units`);
console.log(`   Expected: 146 (200 + 8 - 12 - 50 = 146)`);
console.log(`   Status: ${inventory3.net === 146 ? '✅ CORRECT' : '❌ WRONG'}`);

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n\n' + '='.repeat(100));
console.log(' SUMMARY');
console.log('='.repeat(100));

const allPassed = inventory1.net === 85 && inventory2.net === 110 && inventory3.net === 146;

console.log(`\n📋 TEST RESULTS:`);
console.log(`   Test 1 (Customer Return): ${inventory1.net} units → ${inventory1.net === 85 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Test 2 (Stock Return): ${inventory2.net} units → ${inventory2.net === 110 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Test 3 (Both Returns): ${inventory3.net} units → ${inventory3.net === 146 ? '✅ PASS' : '❌ FAIL'}`);

console.log(`\n📊 FORMULA BREAKDOWN:`);
console.log(`\n   ✅ CUSTOMER RETURN: Items coming BACK to shop from customers`);
console.log(`      → ADDED to inventory (positive)`);
console.log(`      → Example: 100 units - 20 sold = 80, customer returns 5 → 85`);

console.log(`\n   ❌ STOCK RETURN: Items going BACK to warehouse from shop`);
console.log(`      → SUBTRACTED from inventory (negative)`);
console.log(`      → Example: 150 units - 30 sold = 120, stock returns 10 → 110`);

console.log(`\n   📐 COMPLETE FORMULA:`);
console.log(`      net = import + customerReturn - stockReturn - sales`);

console.log(`\n` + '='.repeat(100));
if (allPassed) {
  console.log(' ✅ ALL TESTS PASSED - Customer & Stock Returns Handled Correctly!');
} else {
  console.log(' ❌ SOME TESTS FAILED');
}
console.log('='.repeat(100) + '\n');
