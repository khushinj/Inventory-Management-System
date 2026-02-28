/**
 * Deduplication Script
 * Cleans up duplicate inventory entries caused by spacing issues
 * Merges entries with the same design number (ignoring spacing)
 */

import fs from 'fs';
import path from 'path';
import { normalizeDesignNumber, normalizeColor, normalizeSize } from './backend/utils/normalization.js';

async function dedupShopInventory() {
  console.log('🔍 Starting Shop Inventory Deduplication...\n');
  
  const shopInventoryPath = './shop_inventory.json';
  
  try {
    // Read current inventory
    const rawData = fs.readFileSync(shopInventoryPath, 'utf-8');
    const inventory = JSON.parse(rawData);
    
    console.log(`📊 Current inventory entries: ${inventory.length}`);
    
    // Create a map using normalized keys to merge duplicates
    const mergedMap = new Map();
    
    inventory.forEach(item => {
      const normalizedDno = normalizeDesignNumber(item.designNumber);
      const normalizedColor = normalizeColor(item.color);
      const normalizedSize = normalizeSize(item.size);
      
      const key = `${normalizedDno}|${normalizedColor}|${normalizedSize}`;
      
      if (mergedMap.has(key)) {
        // Duplicate found - merge quantities
        const existing = mergedMap.get(key);
        console.log(`  ⚠️  Duplicate found: "${item.designNumber}" vs "${existing.designNumber}"`);
        console.log(`      Original (${normalizedDno}|${normalizedColor}|${normalizedSize})`);
        
        // Merge numeric values
        existing.import = (existing.import || 0) + (item.import || 0);
        existing.return = (existing.return || 0) + (item.return || 0);
        existing.sales = (existing.sales || 0) + (item.sales || 0);
        existing.net = (existing.net || 0) + (item.net || 0);
      } else {
        // First time seeing this normalized combination
        mergedMap.set(key, {
          designNumber: normalizedDno,
          color: normalizedColor,
          size: normalizedSize,
          import: item.import || 0,
          return: item.return || 0,
          sales: item.sales || 0,
          net: item.net || 0,
          type: item.type || 'regular'
        });
      }
    });
    
    // Convert map back to array and sort
    const deduplicatedInventory = Array.from(mergedMap.values());
    
    // Sort by design number, color, size
    deduplicatedInventory.sort((a, b) => {
      if (a.designNumber !== b.designNumber) {
        return a.designNumber.localeCompare(b.designNumber);
      }
      if (a.color !== b.color) {
        return a.color.localeCompare(b.color);
      }
      
      // Size ordering
      const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
      const aIndex = sizeOrder.indexOf(a.size);
      const bIndex = sizeOrder.indexOf(b.size);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      return a.size.localeCompare(b.size);
    });
    
    // Check if any changes were made
    const removedDuplicates = inventory.length - deduplicatedInventory.length;
    
    if (removedDuplicates > 0) {
      console.log(`\n✅ Deduplication Complete!`);
      console.log(`   Original entries: ${inventory.length}`);
      console.log(`   Deduplicated entries: ${deduplicatedInventory.length}`);
      console.log(`   Duplicates merged: ${removedDuplicates}`);
      
      // Backup original file
      const backupPath = `${shopInventoryPath}.backup.${new Date().toISOString().split('T')[0]}`;
      fs.writeFileSync(backupPath, rawData);
      console.log(`\n💾 Original file backed up to: ${backupPath}`);
      
      // Save deduplicated inventory
      fs.writeFileSync(shopInventoryPath, JSON.stringify(deduplicatedInventory, null, 2));
      console.log(`✨ Deduplicated inventory saved to: ${shopInventoryPath}`);
    } else {
      console.log(`\n✅ No duplicates found!`);
      console.log(`   All entries are already unique (when normalized).`);
    }
    
  } catch (error) {
    console.error('❌ Error during deduplication:', error.message);
    process.exit(1);
  }
}

async function dedupDataFiles() {
  console.log('\n\n🔍 Starting Data Files Deduplication...\n');
  
  const dataDir = './backend/data';
  const files = ['import_data.json', 'return_data.json', 'sales_data.json'];
  
  for (const file of files) {
    console.log(`\nProcessing ${file}...`);
    const filePath = path.join(dataDir, file);
    
    try {
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(rawData);
      
      console.log(`  📊 Original entries: ${data.length}`);
      
      // Create a map using normalized keys to merge duplicates
      const mergedMap = new Map();
      
      data.forEach(item => {
        const normalizedDno = normalizeDesignNumber(item.dno);
        const normalizedColor = normalizeColor(item.color);
        
        const key = `${normalizedDno}|${normalizedColor}`;
        
        if (mergedMap.has(key)) {
          const existing = mergedMap.get(key);
          console.log(`    ⚠️  Duplicate: "${item.dno}" vs "${existing.dno}"`);
          
          // Merge sizes
          if (item.sizes && typeof item.sizes === 'object') {
            for (const [size, qty] of Object.entries(item.sizes)) {
              const normalizedSize = normalizeSize(size);
              existing.sizes[normalizedSize] = (existing.sizes[normalizedSize] || 0) + qty;
              existing.totalQty += qty;
            }
          }
        } else {
          mergedMap.set(key, {
            dno: normalizedDno,
            color: normalizedColor,
            sizes: item.sizes ? Object.fromEntries(
              Object.entries(item.sizes).map(([size, qty]) => [normalizeSize(size), qty])
            ) : {},
            totalQty: item.totalQty || 0,
            type: item.type || file.replace('_data.json', '')
          });
        }
      });
      
      const deduplicatedData = Array.from(mergedMap.values());
      const removedDuplicates = data.length - deduplicatedData.length;
      
      if (removedDuplicates > 0) {
        const backupPath = `${filePath}.backup`;
        fs.writeFileSync(backupPath, rawData);
        fs.writeFileSync(filePath, JSON.stringify(deduplicatedData, null, 2));
        console.log(`  ✅ Deduplicated! Removed ${removedDuplicates} duplicates. Backup: ${backupPath}`);
      } else {
        console.log(`  ✅ No duplicates found!`);
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${file}:`, error.message);
    }
  }
}

// Run deduplication
(async () => {
  await dedupShopInventory();
  await dedupDataFiles();
  console.log('\n\n🎉 Deduplication process completed!\n');
})();
