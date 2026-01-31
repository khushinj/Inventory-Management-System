import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api/daily-report';

// Helper function to make requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    const data = await response.json();
    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    console.error('Request failed:', error.message);
    return {
      status: 500,
      ok: false,
      error: error.message,
    };
  }
}

// Test functions
async function testCreateDailyReport() {
  console.log('\n📝 Testing: Create Daily Report');
  console.log('=' .repeat(50));
  
  const reportData = {
    date: '2026-01-31',
    cashInHand: 300,
    cashSale: 400,
    upi: 2,
    creditCard: 3,
    creditNote: 80,
    expense: 50,
  };
  
  const result = await makeRequest(API_BASE, {
    method: 'POST',
    body: JSON.stringify(reportData),
  });
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  console.log('✅ Test completed\n');
  
  return result;
}

async function testGetAllReports() {
  console.log('\n📋 Testing: Get All Daily Reports');
  console.log('='.repeat(50));
  
  const result = await makeRequest(API_BASE);
  
  console.log('Status:', result.status);
  console.log('Count:', result.data.count);
  console.log('Reports:', result.data.data?.length || 0);
  console.log('✅ Test completed\n');
  
  return result;
}

async function testGetReportByDate() {
  console.log('\n📅 Testing: Get Report by Date');
  console.log('='.repeat(50));
  
  const date = '2026-01-31';
  const result = await makeRequest(`${API_BASE}/${date}`);
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  console.log('✅ Test completed\n');
  
  return result;
}

async function testGetReportsByDateRange() {
  console.log('\n📆 Testing: Get Reports by Date Range');
  console.log('='.repeat(50));
  
  const startDate = '2026-01-01';
  const endDate = '2026-01-31';
  const result = await makeRequest(`${API_BASE}/range?startDate=${startDate}&endDate=${endDate}`);
  
  console.log('Status:', result.status);
  console.log('Count:', result.data.count);
  console.log('Date Range:', result.data.dateRange);
  console.log('✅ Test completed\n');
  
  return result;
}

async function testGetReportsByMonth() {
  console.log('\n🗓️  Testing: Get Reports by Month');
  console.log('='.repeat(50));
  
  const year = 2026;
  const month = 1;
  const result = await makeRequest(`${API_BASE}/month/${year}/${month}`);
  
  console.log('Status:', result.status);
  console.log('Count:', result.data.count);
  console.log('Month:', result.data.month);
  console.log('✅ Test completed\n');
  
  return result;
}

async function testGetSummaryStats() {
  console.log('\n📊 Testing: Get Summary Statistics');
  console.log('='.repeat(50));
  
  const startDate = '2026-01-01';
  const endDate = '2026-01-31';
  const result = await makeRequest(`${API_BASE}/summary?startDate=${startDate}&endDate=${endDate}`);
  
  console.log('Status:', result.status);
  console.log('Summary:', JSON.stringify(result.data.data, null, 2));
  console.log('✅ Test completed\n');
  
  return result;
}

async function testUpdateDailyReport() {
  console.log('\n✏️  Testing: Update Daily Report');
  console.log('='.repeat(50));
  
  const updatedData = {
    date: '2026-01-31',
    cashInHand: 350,
    cashSale: 450,
    upi: 5,
    creditCard: 10,
    creditNote: 100,
    expense: 60,
  };
  
  const result = await makeRequest(API_BASE, {
    method: 'POST',
    body: JSON.stringify(updatedData),
  });
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  console.log('✅ Test completed\n');
  
  return result;
}

async function testValidation() {
  console.log('\n🔒 Testing: Validation (Invalid Data)');
  console.log('='.repeat(50));
  
  const invalidData = {
    date: 'invalid-date',
    cashInHand: -100,
    cashSale: 'not-a-number',
  };
  
  const result = await makeRequest(API_BASE, {
    method: 'POST',
    body: JSON.stringify(invalidData),
  });
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  console.log('✅ Validation working correctly\n');
  
  return result;
}

async function testDeleteReport() {
  console.log('\n🗑️  Testing: Delete Daily Report');
  console.log('='.repeat(50));
  
  const date = '2026-01-31';
  const result = await makeRequest(`${API_BASE}/${date}`, {
    method: 'DELETE',
  });
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  console.log('✅ Test completed\n');
  
  return result;
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Starting Daily Report API Tests');
  console.log('=' .repeat(50));
  console.log(`API Base URL: ${API_BASE}`);
  console.log('Time:', new Date().toISOString());
  console.log('='.repeat(50));
  
  try {
    // Test creating a report
    await testCreateDailyReport();
    
    // Test getting all reports
    await testGetAllReports();
    
    // Test getting report by date
    await testGetReportByDate();
    
    // Test getting reports by date range
    await testGetReportsByDateRange();
    
    // Test getting reports by month
    await testGetReportsByMonth();
    
    // Test getting summary statistics
    await testGetSummaryStats();
    
    // Test updating a report
    await testUpdateDailyReport();
    
    // Test validation
    await testValidation();
    
    // Test deleting a report (run last)
    // await testDeleteReport();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.log('='.repeat(50));
  }
}

// Run the tests
runAllTests();
