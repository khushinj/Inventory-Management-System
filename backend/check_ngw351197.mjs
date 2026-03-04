#!/usr/bin/env node
import mongoose from 'mongoose';
import { getTransactionModel } from './models/Transaction.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-management';

async function checkDesign() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const dno = 'NGW-351197';
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPLETE CALCULATION FOR: ' + dno);
    console.log('='.repeat(80));
    
    // Get all transaction types
    const ShopImport = getTransactionModel('shop', '', 'import');
    const ShopSales = getTransactionModel('shop', '', 'sales');
    const ShopReturn = getTransactionModel('shop', '', 'return');
    
    const imports = await ShopImport.find({ dno: { $regex: new RegExp('^' + dno + '$', 'i') } }).lean();
    const sales = await ShopSales.find({ dno: { $regex: new RegExp('^' + dno + '$', 'i') } }).lean();
    const allReturns = await ShopReturn.find({ dno: { $regex: new RegExp('^' + dno + '$', 'i') } }).lean();
    
    const customerReturns = allReturns.filter(r => r.channel !== 'domestic return');
    const stockReturns = allReturns.filter(r => r.channel === 'domestic return');
    
    console.log('\n📦 TRANSACTION SUMMARY:');
    console.log('   Import transactions: ' + imports.length);
    console.log('   Sales transactions: ' + sales.length);
    console.log('   Customer Return transactions: ' + customerReturns.length);
    console.log('   Stock Return transactions: ' + stockReturns.length);
    
    // Group by color and size
    const byColorSize = {};
    
    imports.forEach(t => {
      const color = (t.color || '').toUpperCase();
      const size = (t.size || '').toUpperCase();
      const key = `${color}|${size}`;
      if (!byColorSize[key]) byColorSize[key] = { color, size, import: 0, customerReturn: 0, stockReturn: 0, sales: 0 };
      byColorSize[key].import += Number(t.qty) || 0;
    });
    
    sales.forEach(t => {
      const color = (t.color || '').toUpperCase();
      const size = (t.size || '').toUpperCase();
      const key = `${color}|${size}`;
      if (!byColorSize[key]) byColorSize[key] = { color, size, import: 0, customerReturn: 0, stockReturn: 0, sales: 0 };
      byColorSize[key].sales += Number(t.qty) || 0;
    });
    
    customerReturns.forEach(t => {
      const color = (t.color || '').toUpperCase();
      const size = (t.size || '').toUpperCase();
      const key = `${color}|${size}`;
      if (!byColorSize[key]) byColorSize[key] = { color, size, import: 0, customerReturn: 0, stockReturn: 0, sales: 0 };
      byColorSize[key].customerReturn += Number(t.qty) || 0;
    });
    
    stockReturns.forEach(t => {
      const color = (t.color || '').toUpperCase();
      const size = (t.size || '').toUpperCase();
      const key = `${color}|${size}`;
      if (!byColorSize[key]) byColorSize[key] = { color, size, import: 0, customerReturn: 0, stockReturn: 0, sales: 0 };
      byColorSize[key].stockReturn += Number(t.qty) || 0;
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 DETAILED CALCULATION BY COLOR & SIZE');
    console.log('='.repeat(80));
    console.log('Formula: Net = Import + CustomerReturn - StockReturn - Sales\n');
    
    let grandTotal = { import: 0, customerReturn: 0, stockReturn: 0, sales: 0, net: 0 };
    
    Object.entries(byColorSize).sort().forEach(([key, data]) => {
      const net = data.import + data.customerReturn - data.stockReturn - data.sales;
      const finalNet = Math.max(0, net);
      
      console.log(`${data.color} | ${data.size}`);
      console.log(`   Import:          ${data.import}`);
      console.log(`   Customer Return: +${data.customerReturn}`);
      console.log(`   Stock Return:    -${data.stockReturn}`);
      console.log(`   Sales:           -${data.sales}`);
      console.log(`   ─────────────────────────`);
      console.log(`   Net = ${data.import} + ${data.customerReturn} - ${data.stockReturn} - ${data.sales} = ${net}`);
      console.log(`   Final Net (≥0):  ${finalNet}\n`);
      
      grandTotal.import += data.import;
      grandTotal.customerReturn += data.customerReturn;
      grandTotal.stockReturn += data.stockReturn;
      grandTotal.sales += data.sales;
      grandTotal.net += finalNet;
    });
    
    console.log('='.repeat(80));
    console.log('📊 GRAND TOTALS FOR ' + dno);
    console.log('='.repeat(80));
    console.log(`Total Import:          ${grandTotal.import}`);
    console.log(`Total Customer Return: +${grandTotal.customerReturn}`);
    console.log(`Total Stock Return:    -${grandTotal.stockReturn}`);
    console.log(`Total Sales:           -${grandTotal.sales}`);
    console.log(`─────────────────────────────────`);
    console.log(`Total Net Inventory:   ${grandTotal.net}\n`);
    
    if (stockReturns.length > 0) {
      console.log('🔴 STOCK RETURN DETAILS (Items returned to warehouse):');
      stockReturns.forEach((r, i) => {
        console.log(`   ${i+1}. Color: ${r.color}, Size: ${r.size}, Qty: ${r.qty}, Channel: ${r.channel}, Date: ${new Date(r.date).toISOString().split('T')[0]}`);
      });
      console.log('');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDesign();
