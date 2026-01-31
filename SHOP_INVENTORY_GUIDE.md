# Shop Inventory System - Complete Guide

## Overview

The Shop Inventory System automatically calculates and displays available stock based on import, return, and sales data. It provides real-time inventory tracking with automatic recalculation whenever transactions occur.

## Features

✅ **Automatic Calculation**: Inventory is calculated from import, return, and sales data
✅ **Real-time Updates**: Auto-recalculates after every transaction
✅ **Design Number Normalization**: Handles variations like "aaw-85089a" → "aw-85089a"
✅ **No Negative Stock**: Ensures net quantity never goes below zero
✅ **Multi-dimensional Filtering**: Search by design number, filter by size and color
✅ **Grouped Display**: Shows stock grouped by design number and color
✅ **Product Integration**: Displays product details from job cards when available

## How It Works

### Calculation Formula

For each unique combination of (Design Number + Color + Size):

```
Net Quantity = (Import Quantity + Return Quantity) - Sales Quantity
```

- If Net Quantity < 0, it's set to 0 (no negative stock)
- All design numbers are normalized (lowercase, trim whitespace)
- Special handling: "aaw-" prefix → "aw-" prefix

### Data Sources

1. **Import Data** (`backend/data/import_data.json`): Stock received from suppliers
2. **Return Data** (`backend/data/return_data.json`): Items returned from customers
3. **Sales Data** (`backend/data/sales_data.json`): Items sold to customers

### Automation

The system automatically recalculates inventory after:
- Creating a new transaction (shop, domestic, export, online)
- Updating an existing transaction
- Deleting a transaction

This is handled by the `autoRecalculateInventory` middleware applied to all transaction routes.

## API Endpoints

### Calculate Inventory
```
POST /api/shop-inventory/calculate
```
Recalculates the entire inventory from scratch based on current import, return, and sales data.

**Response:**
```json
{
  "success": true,
  "message": "Shop inventory calculated and saved successfully",
  "totalRecords": 780
}
```

### Get Inventory
```
GET /api/shop-inventory
```
Retrieves shop inventory with optional filters.

**Query Parameters:**
- `designNumber` - Filter by design number (partial match)
- `color` - Filter by color (partial match)
- `size` - Filter by exact size
- `hideZeroStock` - Set to "true" to only show items with stock

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "designNumber": "ng-19336",
      "color": "BLUE MELANGE",
      "size": "M",
      "import": 0,
      "return": 5,
      "sales": 0,
      "net": 5,
      "type": "return"
    }
  ],
  "totalRecords": 697
}
```

### Get Grouped Inventory
```
GET /api/shop-inventory/grouped/:designNumber
```
Retrieves inventory for a specific design number, grouped by color.

**Response:**
```json
{
  "success": true,
  "designNumber": "ng-19336",
  "data": {
    "BLUE MELANGE": [
      { "size": "S", "net": 3, ... },
      { "size": "M", "net": 5, ... }
    ],
    "RUST": [
      { "size": "L", "net": 2, ... }
    ]
  },
  "totalColors": 2
}
```

## Frontend UI

### Page: `/shop-inventory`

The shop inventory page provides:

1. **Search Bar**: Search by design number
2. **Filters Sidebar**:
   - Size filter (XS, S, M, L, XL, XXL, 3XL, 4XL, 5XL)
   - Color filter (Black, Navy, Blue, etc.)
3. **Product Cards**: Each card displays:
   - Product image (from job card if available)
   - Design number
   - Brand, Fabric, Composition, GSM, MRP (if available)
   - **Available Stock Table** with columns:
     - Colour (with color indicator dot)
     - Size
     - Quantity (in colored badges)
     - Type (Regular/Premium)

### UI Features

- **Color-coded Quantities**: 
  - Red badge: < 10 units (low stock)
  - Black badge: ≥ 10 units
- **Color Indicators**: Visual color dots next to color names
- **Responsive Design**: Works on desktop and mobile
- **Sticky Filters**: Sidebar stays visible while scrolling

## Data Structure

### Input Data Format (Import/Return/Sales)

```json
{
  "dno": "NG-19336",
  "color": "BLUE MELANGE",
  "sizes": {
    "S": 1,
    "M": 2,
    "L": 1,
    "XL": 1,
    "XXL": 1
  },
  "totalQty": 6,
  "type": "import"
}
```

### Output Inventory Format

```json
{
  "designNumber": "ng-19336",
  "color": "BLUE MELANGE",
  "size": "M",
  "import": 0,
  "return": 2,
  "sales": 0,
  "net": 2,
  "type": "return"
}
```

## Backend Structure

```
backend/
├── services/
│   └── shopInventory.service.js      # Core calculation logic
├── controllers/
│   └── shopInventory.controller.js   # API handlers
├── routes/
│   └── shopInventory.route.js        # API routes
├── middleware/
│   └── autoRecalculateInventory.js   # Auto-recalculation middleware
└── data/
    ├── import_data.json              # Import records
    ├── return_data.json              # Return records
    └── sales_data.json               # Sales records
```

## Usage Examples

### Manual Recalculation

```bash
# Using the API
curl -X POST http://localhost:5000/api/shop-inventory/calculate

# Using the verification script
cd backend
node verify_inventory.mjs
```

### Get All Stock

```bash
curl http://localhost:5000/api/shop-inventory?hideZeroStock=true
```

### Search by Design Number

```bash
curl http://localhost:5000/api/shop-inventory?designNumber=ng-19336
```

### Filter by Color and Size

```bash
curl http://localhost:5000/api/shop-inventory?color=BLUE&size=M
```

## Testing

### Verify Calculations

Run the verification script:

```bash
cd backend
node verify_inventory.mjs
```

This will:
1. Recalculate inventory
2. Show total records
3. Display sample items with stock
4. Verify design number normalization

### Check Inventory Stats

```bash
node check_inventory.js
```

This shows:
- Total items with stock
- Designs with multiple colors
- Detailed breakdown of a sample design

## Current Statistics

Based on the latest calculation:
- **Total Records**: 780 (all combinations of design/color/size)
- **Items with Stock**: 697 (items with net quantity > 0)
- **Unique Designs**: Hundreds of different design numbers
- **Data Sources**: 
  - Import: 405 lines
  - Return: 2024 lines
  - Sales: 333 lines

## Important Notes

1. **No Negative Stock**: The system prevents negative quantities. If sales exceed imports+returns, net is set to 0.

2. **Case Insensitive**: All design numbers and colors are normalized to uppercase for consistency.

3. **Automatic Updates**: Every transaction automatically triggers inventory recalculation, so the data is always current.

4. **Design Number Normalization**: Special handling for variations (e.g., "AAW-85089A" becomes "AW-85089A").

5. **Blank Fields**: The UI shows product details from job cards when available, leaves fields blank when not available (no Location field shown).

## Troubleshooting

### Inventory not updating?
- Check that the middleware is applied to transaction routes
- Verify the data files are in `backend/data/` directory
- Check server logs for calculation errors

### Incorrect quantities?
- Run manual recalculation: `POST /api/shop-inventory/calculate`
- Verify source data in import/return/sales JSON files
- Check for duplicate entries with different case/spacing

### Frontend not showing data?
- Ensure backend is running on port 5000
- Check browser console for API errors
- Verify `hideZeroStock` filter setting

## Future Enhancements

- [ ] Export inventory to Excel
- [ ] Inventory history tracking
- [ ] Low stock alerts
- [ ] Warehouse location support
- [ ] Batch operations
- [ ] Real-time notifications
