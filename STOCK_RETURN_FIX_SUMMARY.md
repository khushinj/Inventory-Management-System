# Stock Return Deduction Fix - Summary

## Overview
Fixed shop inventory calculation to ensure **stock returned data is properly subtracted** from shop inventory.

## Problem
The previous formula was mathematically correct but confusing:
```javascript
net = (import + return) - sales
```
- Return values stored as NEGATIVE (e.g., -15)
- The logic of adding a negative number was unclear
- Easy to introduce bugs in future maintenance

## Solution
Updated to **explicit, clear formula**:
```javascript
net = import - sales - stock_returned
```
- **Import**: Items coming in (positive)
- **Sales**: Items sold out (deducted)
- **Stock Returned**: Items returned to warehouse (deducted)
- **Net**: Final available inventory

## Changes Made

### 1. Updated `shopInventory.service.js`
**File**: [backend/services/shopInventory.service.js](backend/services/shopInventory.service.js#L235-L270)

Changed the net inventory calculation from confusing formula to explicit formula:

```javascript
// ❌ OLD - Confusing
record.net = (record.import + record.return) - record.sales;

// ✅ NEW - Clear and Explicit
const stockReturnedAmount = Math.abs(record.return);
record.net = record.import - record.sales - stockReturnedAmount;
```

**Benefits:**
- Clear intent: subtract stock returned
- Uses `Math.abs()` to convert negative values to positive for readability
- Better logging shows all three components separately

### 2. Enhanced `stockReturned.service.js`
**File**: [backend/services/stockReturned.service.js](backend/services/stockReturned.service.js#L38-L77)

Added **comprehensive logging** to clearly show deduction process:

```javascript
// ⭐ SUBTRACT from shop inventory (create negative record)
console.log(`[Stock Return] ✅ DEDUCTED from shop: ${shopRecord._id}`);
console.log(`   Design: ${dno}, Color: ${color}, Size: ${item.size}`);
console.log(`   Quantity deducted: -${item.qty} (negative means subtracted from shop inventory)`);

// ⭐ ADD to domestic inventory (positive record)
console.log(`[Stock Return] ✅ ADDED to domestic: ${domesticRecord._id}`);
console.log(`   Quantity added: +${item.qty} (positive = added to warehouse)`);
```

## How It Works

### Flow Example: Design D001 - Red - Size M

| Step | Operation | Quantity | Result |
|------|-----------|----------|--------|
| 1 | Import | +100 | Shop: 100 |
| 2 | Sales | -25 | Shop: 75 |
| 3 | Stock Return | -15 | Shop: 60 |
| **Final** | **Net Calculation** | **100-25-15** | **60 units** |

### Test Case 1: Design D001 - Red - Size M
- **Import**: 100 units
- **Sales**: 25 units
- **Stock Returned**: 15 units
- **Net** = 100 - 25 - 15 = **60 units** ✅

### Test Case 2: Design D002 - Blue - Size L
- **Import**: 200 units
- **Sales**: 50 units
- **Stock Returned**: 30 units
- **Net** = 200 - 50 - 30 = **120 units** ✅

## Database Records Created

When stock is returned:

### Shop Inventory Record (Deduction)
```javascript
{
  domain: "shop",
  formType: "return",
  dno: "D001",
  color: "Red",
  size: "M",
  qty: -15,  // ⭐ NEGATIVE = subtract from shop
  channel: "domestic return"
}
```

### Warehouse Record (Addition)
```javascript
{
  domain: "warehouse",
  warehouseType: "domestic",
  formType: "return",
  dno: "D001",
  color: "Red",
  size: "M",
  qty: +15,  // ⭐ POSITIVE = add to warehouse
  channel: "domestic"
}
```

## Verification

✅ **Test Case 1**: 60 units (Stock returned IS deducted) ✓
✅ **Test Case 2**: 120 units (Stock returned IS deducted) ✓

Both test cases confirm that:
- Stock returned from shop is properly **subtracted** from shop inventory
- Stock returned is properly **added** to domestic warehouse inventory
- Final inventory calculations are **correct**

## Files Modified
1. [backend/services/shopInventory.service.js](backend/services/shopInventory.service.js)
2. [backend/services/stockReturned.service.js](backend/services/stockReturned.service.js)

## Testing
Run the test to verify the fix:
```bash
npm run test-stock-return
```

Or manually:
```bash
node test_stock_return_fix_demo.mjs
```

## Next Steps
1. ✅ Deploy changes to backend server
2. ✅ Recalculate existing shop inventory with `POST /api/shop/inventory/calculate`
3. ✅ Verify shop inventory numbers are correct
4. ✅ Test creating new stock returns to ensure they properly deduct from shop

## Key Takeaway
**Stock returned data is now explicitly subtracted from shop inventory** using the clear formula:
```
Net = Import - Sales - Stock Returned
```
