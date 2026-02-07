# Differential Inventory API - Export & Online Warehouses

## Overview
This system provides separate inventory tracking for **Domestic**, **Export**, and **Online** warehouses. Each warehouse maintains its own differential inventory calculated from transactions (inbound vs outbound).

## API Endpoints

### 1. Get Full Warehouse Inventory
```
GET /api/inventory/warehouse/:type
```
Get complete inventory with all SKUs for a warehouse.

**Parameters:**
- `:type` - `domestic`, `export`, or `online`

**Response:**
```json
{
  "warehouseType": "export",
  "itemsCount": 45,
  "items": [
    {
      "dno": "D001",
      "color": "RED",
      "size": "M",
      "inbound": 100,
      "outbound": 30,
      "stock": 70,
      "transactions": [...]
    }
  ]
}
```

---

### 2. Get Warehouse Summary
```
GET /api/inventory/warehouse/:type/summary
```
Get quick summary stats for a warehouse.

**Parameters:**
- `:type` - `domestic`, `export`, or `online`

**Response:**
```json
{
  "warehouseType": "export",
  "totalSKUs": 45,
  "totalInbound": 5000,
  "totalOutbound": 2100,
  "totalStock": 2900,
  "items": [...],
  "lastUpdated": "2026-02-07T..."
}
```

---

### 3. Compare Design Across All Warehouses
```
GET /api/inventory/design/:dno
```
See how much stock of a specific design exists in each warehouse.

**Parameters:**
- `:dno` - Design Number (e.g., "D001")

**Response:**
```json
{
  "dno": "D001",
  "warehouses": {
    "domestic": {
      "totalStock": 150,
      "items": [...]
    },
    "export": {
      "totalStock": 80,
      "items": [...]
    },
    "online": {
      "totalStock": 45,
      "items": [...]
    }
  }
}
```

---

### 4. Get Low Stock Items
```
GET /api/inventory/warehouse/:type/low-stock?threshold=10
```
Find items running low on stock.

**Parameters:**
- `:type` - `domestic`, `export`, or `online`
- `?threshold` - Stock level threshold (default: 10)

**Response:**
```json
{
  "warehouseType": "export",
  "threshold": 10,
  "itemsCount": 5,
  "items": [
    {
      "dno": "D005",
      "color": "BLUE",
      "size": "S",
      "stock": 3
    }
  ]
}
```

---

### 5. Get Out of Stock Items
```
GET /api/inventory/warehouse/:type/out-of-stock
```
Find items that are completely out of stock.

**Parameters:**
- `:type` - `domestic`, `export`, or `online`

**Response:**
```json
{
  "warehouseType": "export",
  "itemsCount": 2,
  "items": [...]
}
```

---

### 6. Get Inventory Trends
```
GET /api/inventory/warehouse/:type/trends?days=30
```
See inbound/outbound trends over time.

**Parameters:**
- `:type` - `domestic`, `export`, or `online`
- `?days` - Number of days to look back (default: 30)

**Response:**
```json
{
  "warehouseType": "export",
  "days": 30,
  "trends": [
    {
      "date": "2026-02-01",
      "inbound": 150,
      "outbound": 45,
      "netChange": 105
    },
    {
      "date": "2026-02-02",
      "inbound": 200,
      "outbound": 80,
      "netChange": 120
    }
  ]
}
```

---

### 7. Compare All Warehouses
```
GET /api/inventory/compare-all
```
Get a comprehensive comparison across all warehouses.

**Response:**
```json
{
  "timestamp": "2026-02-07T...",
  "warehouses": {
    "domestic": {
      "warehouseType": "domestic",
      "totalSKUs": 50,
      "totalInbound": 10000,
      "totalOutbound": 3500,
      "totalStock": 6500,
      "items": [...]
    },
    "export": {
      "warehouseType": "export",
      "totalSKUs": 45,
      "totalInbound": 5000,
      "totalOutbound": 2100,
      "totalStock": 2900,
      "items": [...]
    },
    "online": {
      "warehouseType": "online",
      "totalSKUs": 40,
      "totalInbound": 3000,
      "totalOutbound": 1800,
      "totalStock": 1200,
      "items": [...]
    }
  },
  "grandTotal": {
    "totalSKUs": 135,
    "totalInbound": 18000,
    "totalOutbound": 7400,
    "totalStock": 10600
  }
}
```

---

## How Inventory is Calculated

### Inbound Transactions (Add to Stock):
- Production
- Purchase
- Transfer Inwards

### Outbound Transactions (Subtract from Stock):
- Dispatch
- Sales
- Transfer Outwards
- Return

### Formula:
```
Stock = Total Inbound - Total Outbound
```

---

## Example Usage

### Check Export Warehouse Inventory Summary
```bash
curl http://localhost:5000/api/inventory/warehouse/export/summary
```

### Get Design D001 Stock Across All Warehouses
```bash
curl http://localhost:5000/api/inventory/design/D001
```

### Find Low Stock Items in Online Warehouse (less than 20 units)
```bash
curl "http://localhost:5000/api/inventory/warehouse/online/low-stock?threshold=20"
```

### Get 60-Day Trends for Export Warehouse
```bash
curl "http://localhost:5000/api/inventory/warehouse/export/trends?days=60"
```

### Compare All Warehouses
```bash
curl http://localhost:5000/api/inventory/compare-all
```

---

## Notes

- Each warehouse (**Domestic**, **Export**, **Online**) maintains its own separate transaction records
- Inventory is calculated in real-time when you query the API
- Stock calculations are based on all historical transactions
- Low stock alerts can help with procurement planning
- Trends help identify seasonal patterns and demand

