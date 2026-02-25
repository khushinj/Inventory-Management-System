// Test script to verify automatic dispatch creation from purchase orders
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testPODispatchCreation() {
  try {
    // Create a test purchase order
    console.log('Creating test purchase order...');
    const purchaseOrderData = {
      dealerName: "Test Dealer",
      buyerName: "Test Buyer",
      date: new Date().toISOString(),
      city: "Test City",
      items: [
        {
          designNumber: "TEST001",
          color: "Blue",
          s: 5,
          m: 10,
          l: 15,
          xl: 8,
          xxl: 3,
          xxxl: 0,
          xxxxl: 0,
          xxxxxl: 0,
          xxxxxxl: 0,
          qty: 41,
          mrp: 500,
          dis: 10,
          rate: 450,
          amount: 18450,
          tgst: 5,
          tax: 922.5,
          amt: 19372.5
        }
      ],
      totalQuantity: 41,
      grossTotal: 18450,
      gstOutput: 922.5,
      grandTotal: 19372.5,
      termsCondition: "Test terms"
    };

    const createResponse = await fetch(`${API_BASE}/purchase-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseOrderData)
    });

    const createResult = await createResponse.json();
    
    if (!createResult.success) {
      console.error('❌ Failed to create purchase order:', createResult.message);
      return;
    }

    console.log('✅ Purchase order created successfully!');
    console.log('   PO ID:', createResult.data._id);

    // Wait a moment for dispatch entries to be created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check dispatch entries
    console.log('\nChecking for dispatch entries...');
    const dispatchResponse = await fetch(`${API_BASE}/warehouse/domestic?formType=dispatch`);
    const dispatchEntries = await dispatchResponse.json();

    const poReference = `PO_${createResult.data._id}`;
    const relatedDispatches = dispatchEntries.filter(entry => 
      entry.receiver === poReference
    );

    console.log(`\n📦 Found ${relatedDispatches.length} dispatch entries for this PO:`);
    relatedDispatches.forEach(entry => {
      console.log(`   - DNO: ${entry.dno}, Color: ${entry.color}, Size: ${entry.size}, Qty: ${entry.qty}`);
    });

    if (relatedDispatches.length > 0) {
      console.log('\n✅ SUCCESS! Automatic dispatch creation is working!');
    } else {
      console.log('\n❌ FAILED! No dispatch entries were created.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPODispatchCreation();
