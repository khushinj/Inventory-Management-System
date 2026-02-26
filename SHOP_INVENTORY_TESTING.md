# Shop Inventory - Stock Return Testing Guide

## The Issue
Stock returned entries are being created and showing in domestic inventory (✅), but NOT showing in shop inventory or being subtracted from shop stock (❌).

## What I Fixed

### 1. Added Detailed Logging
Added comprehensive logging to `shopInventory.service.js` that will show:
- How many return transactions are loaded
- Details of each return transaction  
- How return data is processed
- The net calculation for items with returns

### 2. The Logic (How It Should Work)
When stock is returned from shop:
1. **Shop Transaction Created**: `qty = -5` (negative value)
2. **Loaded by Shop Inventory**: Return transaction with negative qty
3. **Calculation**: 
   ```
   Net Stock = (Import + Return) - Sales
   Example: (10 + (-5)) - 2 = 3
   ```
   The negative return value effectively subtracts from the total

## How to Test

### Step 1: Restart Backend Server
The new logging won't work until you restart:
```bash
cd backend
# Stop the current server (Ctrl+C)
npm start
```

### Step 2: Create a Test Stock Return
1. Go to **Stock Returned page** (`/shop-stock-returned`)
2. Create an entry:
   - DNO: `TEST-SHOP-001`
   - Color: `RED`
   - Size M: `5` units
   - Click Save

### Step 3: Watch Backend Console
You should see detailed logs like:
```
[Stock Return] ===== Starting inventory adjustment =====
[Stock Return] ✅ Created shop record: <id> (qty: -5)
[Stock Return] ✅ Created domestic record: <id> (qty: 5)
[Stock Return] ===== Inventory adjustment completed successfully =====
```

Then when shop inventory refreshes:
```
[Shop Inventory] Loading return transactions: X found
[Shop Inventory] Return transaction: DNO=test-shop-001, Color=RED, Size=M, Qty=-5
[Shop Inventory] Processing return: DNO=test-shop-001, ... Qty=-5, New return total=-5
[Shop Inventory] Net calculation: DNO=test-shop-001, Size=M
   Import=X, Return=-5, Sales=Y
   Net = (X + (-5)) - Y = Z
```

### Step 4: Check Shop Inventory
1. Go to **Shop Inventory** page (`/shop-inventory`)
2. Search for `TEST-SHOP-001`
3. You should see the card with reduced stock

## Possible Issues & Solutions

### Issue: Shop inventory shows 0 for the design
**Cause**: No import transactions exist for this design
**Solution**: First create an import entry with some stock before testing returns

### Issue: No logs appear for return transactions
**Cause**: Transactions aren't being created
**Solution**: Check the earlier logs for errors when saving stock return

### Issue: Logs show `Qty=0` for returns
**Cause**: The negative sign is being lost/converted
**Solution**: This is a bug - please share the exact logs you see

### Issue: Card doesn't appear at all
**Cause**: The item might have `net=0` and is filtered out
**Solution**: Try with `hideZeroStock: false` parameter or create import first

## Expected vs Actual

### ✅ Expected Behavior:
```
Before Return: Import=20, Return=0, Sales=5, Net=15
After Return:  Import=20, Return=-5, Sales=5, Net=10
```

### ❌ If Not Working:
Share these from backend logs:
1. The stock return creation logs
2. The shop inventory loading logs
3. The net calculation logs

## Quick Verification Commands

If your backend server is running, check the logs for these patterns:
```bash
# In backend terminal after creating a stock return:
# Look for:
# [Stock Return] ✅ Created shop record
# [Stock Inventory] Loading return transactions
# [Shop Inventory] Processing return
```

## Still Not Working?

If after following these steps it's still not working, please:
1. Share the backend console output
2. Let me know if you see the return transactions being created
3. Tell me what the shop inventory shows (0, wrong number, or nothing)

I can then pinpoint the exact issue!
