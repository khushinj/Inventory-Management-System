# Shop-Domestic Inventory Synchronization

## Overview
This feature automatically synchronizes inventory between the Shop and Domestic Warehouse when stock is received at the shop.

## How It Works

### When Shop Receives Stock (Import)
When a shop import entry is created with the following details:
- Design Number (dno): DN-001
- Type: T-Shirt
- Color: Red
- Size: M
- Quantity: 10

**Two entries are created:**

1. **Shop Import Entry** (Added to shop inventory)
   - Domain: `shop`
   - FormType: `import`
   - Quantity: 10 (adds to shop stock)

2. **Domestic Dispatch Entry** (Subtracted from domestic inventory)
   - Domain: `warehouse`
   - WarehouseType: `domestic`
   - FormType: `dispatch`
   - Quantity: 10 (removes from domestic stock)
   - Channel: `retail`
   - Receiver: `Shop`

### Update Behavior
When updating a shop entry:
- If it was an import and still is → Updates both shop and domestic entries
- If it changes from import to another type → Deletes the domestic dispatch entry
- If it changes to import from another type → Creates a new domestic dispatch entry

### Delete Behavior
When deleting a shop import entry:
- Deletes the shop import entry
- Automatically deletes the corresponding domestic dispatch entry
- This restores the inventory back to domestic warehouse

## Benefits
1. **Automatic Synchronization**: No manual entry needed in domestic warehouse
2. **Accurate Inventory**: Domestic inventory automatically decreases when shop receives stock
3. **Data Integrity**: Updates and deletes are synchronized across both systems
4. **Audit Trail**: Both entries maintain the same dno, type, color, size for traceability

## Implementation Details
- File: `backend/controllers/shop.controller.js`
- Functions Modified:
  - `createShopEntry()` - Creates domestic dispatch on shop import
  - `updateShopEntry()` - Syncs updates to domestic dispatch
  - `deleteShopEntry()` - Removes domestic dispatch when shop import is deleted
  
## Matching Logic
Entries are matched using:
- dno (Design Number)
- type
- color
- size
- qty
- receiver: "Shop"

This ensures the correct domestic dispatch entry is updated or deleted.
