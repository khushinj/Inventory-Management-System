const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const workbook = XLSX.readFile('./frontend/app/RAJESH MISHRA STOCL LIST 00188.xlsx');

console.log('Available sheets:', workbook.SheetNames);

// Function to parse size text like "S/2 M/1 XL/1"
function parseSizeText(sizeText) {
  const sizes = {};
  let totalQty = 0;
  
  if (!sizeText || typeof sizeText !== 'string') return { sizes, totalQty };
  
  const sizePattern = /([A-Z0-9]+)\/(\d+)/gi;
  let match;
  while ((match = sizePattern.exec(sizeText)) !== null) {
    const size = match[1].toUpperCase();
    const qty = parseInt(match[2]);
    if (qty > 0) {
      sizes[size] = qty;
      totalQty += qty;
    }
  }
  
  return { sizes, totalQty };
}

// Process Sheet1 (Import) - has text format sizes
function processSheet1() {
  const worksheet = workbook.Sheets['Sheet1'];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  const entries = [];
  
  data.forEach(row => {
    const dno = row['Article-NO '] || row['Article-NO'];
    const color = row['Colour'] || row['COLOR'];
    const sizeText = row['SIZE'];
    
    if (!dno || !sizeText) return;
    
    const { sizes, totalQty } = parseSizeText(sizeText);
    
    if (totalQty > 0) {
      entries.push({
        dno: String(dno).trim(),
        color: color ? String(color).trim() : '',
        sizes,
        totalQty,
        type: 'import'
      });
    }
  });
  
  return entries;
}

// Process Sheet3 (Return) and Sheet4 (Sales) - handle merged cells
function processSheetWithMergedCells(sheetName, type) {
  const worksheet = workbook.Sheets[sheetName];
  
  // Get as array of arrays to handle merged cells
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  // Find header row
  let headerRow = 0;
  for (let i = 0; i < Math.min(5, rawData.length); i++) {
    const row = rawData[i];
    if (row.some(cell => String(cell).includes('D.NO') || String(cell).includes('DNO'))) {
      headerRow = i;
      break;
    }
  }
  
  const headers = rawData[headerRow];
  console.log(`${sheetName} headers:`, headers);
  
  // Find column indices
  const dnoCol = headers.findIndex(h => String(h).includes('D.NO') || String(h).includes('DNO'));
  const colorCol = headers.findIndex(h => String(h).includes('COLOUR') || String(h).includes('COLOR'));
  
  // Size columns
  const sizeColumns = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
  const sizeColIndices = sizeColumns.map(size => ({
    size,
    index: headers.findIndex(h => String(h).toUpperCase() === size)
  })).filter(s => s.index >= 0);
  
  console.log(`${sheetName} - DNO col: ${dnoCol}, Color col: ${colorCol}`);
  console.log(`${sheetName} - Size columns:`, sizeColIndices.map(s => `${s.size}:${s.index}`));
  
  const entries = [];
  let currentDno = '';
  
  // Process data rows
  for (let i = headerRow + 1; i < rawData.length; i++) {
    const row = rawData[i];
    
    // Update current design number if present
    if (row[dnoCol] && String(row[dnoCol]).trim()) {
      currentDno = String(row[dnoCol]).trim();
    }
    
    // Skip if no design number available
    if (!currentDno) continue;
    
    const color = row[colorCol] ? String(row[colorCol]).trim() : '';
    
    // Extract sizes
    const sizes = {};
    let totalQty = 0;
    
    sizeColIndices.forEach(({ size, index }) => {
      const val = row[index];
      if (val && !isNaN(val) && Number(val) > 0) {
        sizes[size] = Number(val);
        totalQty += Number(val);
      }
    });
    
    if (totalQty > 0) {
      entries.push({
        dno: currentDno,
        color,
        sizes,
        totalQty,
        type
      });
    }
  }
  
  return entries;
}

// Extract all data
console.log('\n========== Extracting Sheet1 (Import) ==========');
const importData = processSheet1();
console.log(`Extracted ${importData.length} import entries`);

console.log('\n========== Extracting Sheet3 (Return) ==========');
const returnData = processSheetWithMergedCells('Sheet3', 'return');
console.log(`Extracted ${returnData.length} return entries`);

console.log('\n========== Extracting Sheet4 (Sales) ==========');
const salesData = processSheetWithMergedCells('Sheet4', 'sales');
console.log(`Extracted ${salesData.length} sales entries`);

// Summary
console.log('\n========== SUMMARY ==========');
console.log('Import entries:', importData.length);
console.log('Return entries:', returnData.length);
console.log('Sales entries:', salesData.length);
console.log('Total entries:', importData.length + returnData.length + salesData.length);

// Save to files
fs.writeFileSync('./backend/data/import_data.json', JSON.stringify(importData, null, 2));
fs.writeFileSync('./backend/data/return_data.json', JSON.stringify(returnData, null, 2));
fs.writeFileSync('./backend/data/sales_data.json', JSON.stringify(salesData, null, 2));

console.log('\n✅ Data files updated successfully!');

// Check for ng-19397
console.log('\n========== Checking NG-19397 ==========');
const ng19397 = [...importData, ...returnData, ...salesData].filter(item => 
  item.dno.toLowerCase().includes('ng-19397')
);
console.log('Found entries for NG-19397:');
ng19397.forEach(entry => {
  console.log(`  ${entry.type.toUpperCase()}: ${entry.dno} - ${entry.color} - Sizes: ${Object.keys(entry.sizes).join(', ')} - Qty: ${entry.totalQty}`);
});

// Show some samples
console.log('\n========== Sample Entries ==========');
console.log('Import sample:', JSON.stringify(importData.slice(0, 2), null, 2));
console.log('Return sample:', JSON.stringify(returnData.slice(0, 2), null, 2));
console.log('Sales sample:', JSON.stringify(salesData.slice(0, 2), null, 2));
