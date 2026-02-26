#!/bin/bash

echo "=============================================="
echo "Stock Return to Domestic Inventory - Verification"
echo "=============================================="
echo ""
echo "This script helps verify that stock returns are properly"
echo "adding data to domestic inventory and creating cards."
echo ""

# Check if server is running
echo "1. Checking if backend server is running..."
if pgrep -f "node.*server.js" > /dev/null; then
    echo "   ✅ Backend server is running"
else
    echo "   ❌ Backend server is NOT running"
    echo "   Please start the server with: cd backend && npm start"
    exit 1
fi

echo ""
echo "2. What was changed:"
echo "   ✅ Improved error handling in stock return service"
echo "   ✅ Added detailed logging for debugging"
echo "   ✅ Errors now properly propagate instead of being silently ignored"
echo "   ✅ Each stock return transaction now logs its success/failure"
echo ""

echo "3. How it works:"
echo "   When you create a stock return entry:"
echo "   - Shop inventory is DECREASED (negative transaction)"
echo "   - Domestic inventory is INCREASED (positive transaction with formType='return')"
echo "   - If the design doesn't exist in domestic, it's auto-created"
echo ""

echo "4. To test:"
echo "   a) Go to Stock Returned page (/shop-stock-returned)"
echo "   b) Create a new entry (e.g., DNO: TEST-001, Color: Blue, Size M: 5)"
echo "   c) Check backend console logs - you should see:"
echo "      [Stock Return] ===== Starting inventory adjustment ====="
echo "      [Stock Return] ✅ Created shop record: ..."
echo "      [Stock Return] ✅ Created domestic record: ..."
echo "   d) Go to Domestic Inventory page (/domestic-inventory)"
echo "   e) Search for your design number (TEST-001)"
echo "   f) You should see a card with the returned stock"
echo ""

echo "5. Where to check logs:"
echo "   - Backend console (where you ran 'npm start')"
echo "   - Look for lines starting with [Stock Return]"
echo ""

echo "6. If it's still not working:"
echo "   - Check the backend console for ERROR messages"
echo "   - Verify MongoDB is running"
echo "   - Check that no errors appear when saving the stock return"
echo "   - Try creating a new entry and watch the logs carefully"
echo ""

echo "=============================================="
echo "Ready to test! Follow steps 4.a through 4.f above"
echo "=============================================="
