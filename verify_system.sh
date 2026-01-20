#!/bin/bash

# Comprehensive System Verification Script
# Usage: bash verify_system.sh

echo "==================================="
echo "Inventory Management System Verification"
echo "==================================="
echo ""

# Check if backend is running
echo "1. Checking Backend Server..."
if curl -s http://localhost:5000 | grep -q "Inventory backend running"; then
    echo "   ✅ Backend is running on http://localhost:5000"
else
    echo "   ❌ Backend is NOT running"
    echo "   Fix: Run 'cd backend && npm start' in another terminal"
    exit 1
fi

# Check MongoDB connection
echo ""
echo "2. Checking MongoDB Connection..."
if curl -s http://localhost:5000/api/warehouse/domestic 2>/dev/null | grep -q "_id"; then
    echo "   ✅ MongoDB is connected and API responding"
else
    echo "   ⚠️  MongoDB may not be connected (check backend logs)"
fi

# Check if frontend is running
echo ""
echo "3. Checking Frontend Server..."
if curl -s http://localhost:3001 | grep -q "html"; then
    echo "   ✅ Frontend is running on http://localhost:3001"
else
    echo "   ❌ Frontend is NOT running"
    echo "   Fix: Run 'cd frontend && npm run dev' in another terminal"
    exit 1
fi

# Test API endpoints
echo ""
echo "4. Testing API Endpoints..."
echo ""

# Test domestic endpoint
echo "   Testing POST /api/warehouse/domestic..."
RESPONSE=$(curl -s -X POST http://localhost:5000/api/warehouse/domestic \
  -H "Content-Type: application/json" \
  -d '{
    "dno": "VERIFY001",
    "type": "Test",
    "qty": 10,
    "date": "2026-01-20",
    "formType": "dispatch",
    "receiver": "Verification",
    "domain": "warehouse",
    "warehouseType": "domestic"
  }')

if echo "$RESPONSE" | grep -q "_id"; then
    ENTRY_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('_id', 'unknown'))" 2>/dev/null)
    echo "   ✅ Entry created successfully (ID: $ENTRY_ID)"
    
    # Verify we can fetch it
    echo "   Testing GET /api/warehouse/domestic..."
    if curl -s http://localhost:5000/api/warehouse/domestic | grep -q "VERIFY001"; then
        echo "   ✅ Entry retrieved successfully"
    else
        echo "   ❌ Entry not found after creation"
    fi
else
    echo "   ❌ Failed to create entry"
    echo "   Response: $RESPONSE"
fi

# Test all warehouse types
echo ""
echo "5. Testing All Warehouse Types..."
for WAREHOUSE in domestic export online; do
    if curl -s http://localhost:5000/api/warehouse/$WAREHOUSE > /dev/null 2>&1; then
        COUNT=$(curl -s http://localhost:5000/api/warehouse/$WAREHOUSE | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
        echo "   ✅ /api/warehouse/$WAREHOUSE - $COUNT entries"
    else
        echo "   ❌ /api/warehouse/$WAREHOUSE - Failed"
    fi
done

# Test shop endpoint
echo ""
echo "6. Testing Shop Endpoint..."
if curl -s http://localhost:5000/api/shop > /dev/null 2>&1; then
    COUNT=$(curl -s http://localhost:5000/api/shop | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
    echo "   ✅ /api/shop - $COUNT entries"
else
    echo "   ❌ /api/shop - Failed"
fi

echo ""
echo "==================================="
echo "✅ System Verification Complete!"
echo "==================================="
echo ""
echo "Next Steps:"
echo "1. Open http://localhost:3001 in browser"
echo "2. Navigate to any warehouse (Domestic, Export, Online, or Shop)"
echo "3. Create a new entry:"
echo "   - Fill form fields"
echo "   - Press Enter to navigate between fields"
echo "   - Click Save Entry"
echo "4. Verify entry appears in dashboard"
echo ""
