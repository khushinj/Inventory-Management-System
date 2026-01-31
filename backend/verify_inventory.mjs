import shopInventoryService from './services/shopInventory.service.js';

async function verifyCalculations() {
  console.log('🔍 Verifying shop inventory calculations...\n');

  // Calculate inventory
  const result = await shopInventoryService.calculateInventory();
  
  if (result.success) {
    console.log(`✅ Calculation successful`);
    console.log(`📦 Total records: ${result.totalRecords}\n`);
    
    // Get some sample data
    const inventory = await shopInventoryService.getInventory({ hideZeroStock: true });
    
    if (inventory.success) {
      console.log(`📊 Items with stock: ${inventory.totalRecords}`);
      console.log(`\n📋 Sample items with stock:\n`);
      
      const samples = inventory.data.slice(0, 10);
      samples.forEach((item, idx) => {
        console.log(`${idx + 1}. Design: ${item.designNumber} | Color: ${item.color} | Size: ${item.size}`);
        console.log(`   Import: ${item.import} | Return: ${item.return} | Sales: ${item.sales} | Net: ${item.net}`);
        console.log('');
      });
      
      // Check for specific design number normalization
      console.log('🔍 Checking design number normalization...');
      const aw85089 = inventory.data.filter(item => item.designNumber.includes('aw-85089'));
      console.log(`Found ${aw85089.length} items with "aw-85089" in design number:`);
      const uniqueDesigns = [...new Set(aw85089.map(item => item.designNumber))];
      console.log('Unique design numbers:', uniqueDesigns);
      
    }
  } else {
    console.error('❌ Calculation failed:', result.error);
  }
  
  process.exit(0);
}

verifyCalculations();
