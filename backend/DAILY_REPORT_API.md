# Daily Report API Documentation

## Overview
The Daily Report API provides endpoints to manage daily sales reports, track expenses, and generate performance metrics for the retail shop.

## Base URL
```
http://localhost:5000/api/daily-report
```

## Endpoints

### 1. Create or Update Daily Report
Creates a new daily report or updates an existing one for the specified date.

**Endpoint:** `POST /api/daily-report`

**Request Body:**
```json
{
  "date": "2026-01-31",
  "cashInHand": 300.00,
  "cashSale": 400.00,
  "upi": 2.00,
  "creditCard": 3.00,
  "creditNote": 80.00,
  "expense": 50.00
}
```

**Response (201 Created or 200 OK):**
```json
{
  "message": "Daily report created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "date": "2026-01-31T00:00:00.000Z",
    "cashInHand": 300.00,
    "cashSale": 400.00,
    "upi": 2.00,
    "creditCard": 3.00,
    "creditNote": 80.00,
    "totalSale": 485.00,
    "expense": 50.00,
    "net": 435.00,
    "createdAt": "2026-01-31T10:30:00.000Z",
    "updatedAt": "2026-01-31T10:30:00.000Z"
  }
}
```

**Validations:**
- `date`: Required, must be a valid date
- All numeric fields must be >= 0
- `totalSale` is auto-calculated as: cashSale + upi + creditCard + creditNote
- `net` is auto-calculated as: totalSale - expense

---

### 2. Get All Daily Reports
Retrieves all daily reports sorted by date (newest first).

**Endpoint:** `GET /api/daily-report`

**Response (200 OK):**
```json
{
  "message": "Daily reports fetched successfully",
  "count": 10,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "date": "2026-01-31T00:00:00.000Z",
      "cashInHand": 300.00,
      "cashSale": 400.00,
      "upi": 2.00,
      "creditCard": 3.00,
      "creditNote": 80.00,
      "totalSale": 485.00,
      "expense": 50.00,
      "net": 435.00,
      "createdAt": "2026-01-31T10:30:00.000Z",
      "updatedAt": "2026-01-31T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Get Daily Report by Date
Retrieves a specific daily report for a given date.

**Endpoint:** `GET /api/daily-report/:date`

**Parameters:**
- `date` (path parameter): Date in format YYYY-MM-DD (e.g., 2026-01-31)

**Example:** `GET /api/daily-report/2026-01-31`

**Response (200 OK):**
```json
{
  "message": "Daily report fetched successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "date": "2026-01-31T00:00:00.000Z",
    "cashInHand": 300.00,
    "cashSale": 400.00,
    "upi": 2.00,
    "creditCard": 3.00,
    "creditNote": 80.00,
    "totalSale": 485.00,
    "expense": 50.00,
    "net": 435.00
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Daily report not found for this date"
}
```

---

### 4. Get Reports by Date Range
Retrieves all daily reports within a specified date range.

**Endpoint:** `GET /api/daily-report/range`

**Query Parameters:**
- `startDate`: Start date in format YYYY-MM-DD
- `endDate`: End date in format YYYY-MM-DD

**Example:** `GET /api/daily-report/range?startDate=2026-01-01&endDate=2026-01-31`

**Response (200 OK):**
```json
{
  "message": "Daily reports fetched successfully",
  "count": 15,
  "dateRange": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  },
  "data": [ /* array of reports */ ]
}
```

**Validations:**
- Both `startDate` and `endDate` are required
- `startDate` cannot be after `endDate`

---

### 5. Get Reports by Month
Retrieves all daily reports for a specific month.

**Endpoint:** `GET /api/daily-report/month/:year/:month`

**Parameters:**
- `year` (path parameter): Year (e.g., 2026)
- `month` (path parameter): Month (1-12)

**Example:** `GET /api/daily-report/month/2026/1`

**Response (200 OK):**
```json
{
  "message": "Monthly reports fetched successfully",
  "count": 20,
  "month": {
    "year": "2026",
    "month": "1"
  },
  "data": [ /* array of reports */ ]
}
```

**Validations:**
- `year` must be between 2000 and 2100
- `month` must be between 1 and 12

---

### 6. Get Summary Statistics
Calculates summary statistics for a date range.

**Endpoint:** `GET /api/daily-report/summary`

**Query Parameters:**
- `startDate`: Start date in format YYYY-MM-DD
- `endDate`: End date in format YYYY-MM-DD

**Example:** `GET /api/daily-report/summary?startDate=2026-01-01&endDate=2026-01-31`

**Response (200 OK):**
```json
{
  "message": "Summary statistics fetched successfully",
  "dateRange": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  },
  "data": {
    "totalReports": 20,
    "totalCashInHand": 6000.00,
    "totalCashSale": 8000.00,
    "totalUPI": 40.00,
    "totalCreditCard": 60.00,
    "totalCreditNote": 1600.00,
    "totalSale": 9700.00,
    "totalExpense": 1000.00,
    "totalNet": 8700.00,
    "averageDailySale": 485.00,
    "averageDailyExpense": 50.00,
    "averageDailyNet": 435.00
  }
}
```

---

### 7. Delete Daily Report
Deletes a daily report for a specific date.

**Endpoint:** `DELETE /api/daily-report/:date`

**Parameters:**
- `date` (path parameter): Date in format YYYY-MM-DD

**Example:** `DELETE /api/daily-report/2026-01-31`

**Response (200 OK):**
```json
{
  "message": "Daily report deleted successfully",
  "data": { /* deleted report object */ }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Daily report not found for this date"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error message",
  "field": "fieldName"
}
```

### 404 Not Found
```json
{
  "message": "Daily report not found for this date"
}
```

### 500 Internal Server Error
```json
{
  "message": "Error message",
  "error": "Detailed error description"
}
```

---

## Data Model

### DailyReport Schema
```javascript
{
  date: Date,              // Unique, normalized to start of day
  cashInHand: Number,      // Cash available at start of day
  cashSale: Number,        // Cash sales for the day
  upi: Number,             // UPI transactions
  creditCard: Number,      // Credit card transactions
  creditNote: Number,      // Credit note transactions
  totalSale: Number,       // Auto-calculated: cashSale + upi + creditCard + creditNote
  expense: Number,         // Daily expenses
  net: Number,             // Auto-calculated: totalSale - expense
  createdAt: Date,         // Auto-generated
  updatedAt: Date          // Auto-generated
}
```

---

## Usage Examples

### Using fetch (JavaScript)
```javascript
// Create a new report
const createReport = async () => {
  const response = await fetch('http://localhost:5000/api/daily-report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      date: '2026-01-31',
      cashInHand: 300,
      cashSale: 400,
      upi: 2,
      creditCard: 3,
      creditNote: 80,
      expense: 50,
    }),
  });
  
  const data = await response.json();
  console.log(data);
};

// Get all reports
const getAllReports = async () => {
  const response = await fetch('http://localhost:5000/api/daily-report');
  const data = await response.json();
  console.log(data);
};

// Get monthly summary
const getMonthlySummary = async () => {
  const response = await fetch(
    'http://localhost:5000/api/daily-report/summary?startDate=2026-01-01&endDate=2026-01-31'
  );
  const data = await response.json();
  console.log(data);
};
```

### Using curl
```bash
# Create a report
curl -X POST http://localhost:5000/api/daily-report \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-31",
    "cashInHand": 300,
    "cashSale": 400,
    "upi": 2,
    "creditCard": 3,
    "creditNote": 80,
    "expense": 50
  }'

# Get all reports
curl http://localhost:5000/api/daily-report

# Get report by date
curl http://localhost:5000/api/daily-report/2026-01-31

# Get monthly reports
curl http://localhost:5000/api/daily-report/month/2026/1

# Get summary statistics
curl "http://localhost:5000/api/daily-report/summary?startDate=2026-01-01&endDate=2026-01-31"

# Delete a report
curl -X DELETE http://localhost:5000/api/daily-report/2026-01-31
```

---

## Notes

- All dates are normalized to 00:00:00 (start of day) to ensure uniqueness
- Only one report can exist per day
- Total Sale is calculated as: Cash Sale + UPI + Credit Card + Credit Note
- Net is calculated as: Total Sale - Expense
- All numeric values default to 0 if not provided
- Negative values are not allowed for any numeric field
