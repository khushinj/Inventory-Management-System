const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file
const workbook = XLSX.readFile('./frontend/app/RAJESH MISHRA STOCL LIST 00188.xlsx');

console.log('Available sheets:', workbook.SheetNames);

// Function to process sizes from a row
function processSizes(row) {
  const sizes = {};
  let totalQty = 0;
  
  // Check if there's a SIZE column with text format like "S/2 M/1 XL/1"
  const sizeText = row['SIZE'] || row['Size'] || row['SIZES'];
  if (sizeText && typeof sizeText === 'string') {
    // Parse format: "S/2  M/1  XL/1  XXL/1 3XL/1"
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
  
  // Otherwise, check individual size columns
  const sizeColumns = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
  
  sizeColumns.forEach(size => {
    if (row[size] && !isNaN(row[size]) && row[size] > 0) {
      sizes[size] = parseInt(row[size]);
      totalQty += parseInt(row[size]);
    }
  });
  
  return { sizes, totalQty };
}

// Extract data from each sheet
const allData = {
  import: [],
  return: [],
  sales: []
};

// Process each sheet
workbook.SheetNames.forEach((sheetName, index) => {
  console.log(`\n========== Processing Sheet ${index + 1}: ${sheetName} ==========`);
  
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`Total rows in ${sheetName}:`, data.length);
  
  if (data.length > 0) {
    console.log('Sample row:', JSON.stringify(data[0], null, 2));
    console.log('All columns:', Object.keys(data[0]));
  }
  
  // Determine the type based on sheet name or content
  let type = 'import';
  const sheetLower = sheetName.toLowerCase();
  if (sheetLower.includes('return')) type = 'return';
  else if (sheetLower.includes('sales') || sheetLower.includes('sale')) type = 'sales';
  else if (sheetLower.includes('import')) type = 'import';
  
  // Try to auto-detect based on sheet number
  if (index === 0) type = 'import';  // Sheet 1
  else if (index === 2) type = 'return'; // Sheet 3
  else if (index === 3) type = 'sales';  // Sheet 4
  
  console.log(`Detected type: ${type}`);
  
  // Process each row
  data.forEach((row, rowIndex) => {
    // Try different column names for design number
    const dno = row['DNO'] || row['dno'] || row['Design Number'] || row['DesignNumber'] || 
                row['DN'] || row['Design No'] || row['DESIGN NUMBER'] || row['Design'] ||
                row['Item'] || row['Item Code'] || row['Code'] || row['D.NO.'] || 
                row['Article-NO '] || row['Article-NO'] || row['ARTICLE-NO'];
    
    // Try different column names for color
    const color = row['COLOR'] || row['color'] || row['Color'] || row['Colour'] || 
                  row['COLOUR'] || row['COL'] || row['COLOURS '] || row['COLOURS'];
    
    if (!dno) {
      if (rowIndex < 5) {
        console.log(`Row ${rowIndex + 1} - No design number found:`, Object.keys(row));
      }
      return;
    }
    
    const { sizes, totalQty } = processSizes(row);
    
    if (totalQty === 0) {
      return; // Skip rows with no quantities
    }
    
    const entry = {
      dno: String(dno).trim(),
      color: color ? String(color).trim() : '',
      sizes: sizes,
      totalQty: totalQty,
      type: type
    };
    
    allData[type].push(entry);
  });
  
  console.log(`Extracted ${allData[type].length} valid entries from ${sheetName}`);
});

// Show summary
console.log('\n========== SUMMARY ==========');
console.log('Import entries:', allData.import.length);
console.log('Return entries:', allData.return.length);
console.log('Sales entries:', allData.sales.length);
console.log('Total entries:', allData.import.length + allData.return.length + allData.sales.length);

// Save to files
fs.writeFileSync('./backend/data/import_data.json', JSON.stringify(allData.import, null, 2));
fs.writeFileSync('./backend/data/return_data.json', JSON.stringify(allData.return, null, 2));
fs.writeFileSync('./backend/data/sales_data.json', JSON.stringify(allData.sales, null, 2));

console.log('\n✅ Data files updated successfully!');

// Check for ng-19397
console.log('\n========== Checking NG-19397 ==========');
const ng19397 = [...allData.import, ...allData.return, ...allData.sales].filter(item => 
  item.dno.toLowerCase().includes('ng-19397')
);
console.log('Found entries for NG-19397:');
ng19397.forEach(entry => {
  console.log(`  ${entry.type.toUpperCase()}: ${entry.dno} - ${entry.color} - Qty: ${entry.totalQty}`);
});
