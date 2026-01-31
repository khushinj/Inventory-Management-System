# Daily Report Backend Structure

## Complete Backend Implementation

This document provides an overview of the complete backend structure for the Daily Report feature.

---

## 📁 File Structure

```
backend/
├── models/
│   └── DailyReport.js                    # MongoDB schema/model
├── controllers/
│   └── dailyReport.controller.js         # Request handlers
├── services/
│   └── dailyReport.service.js            # Business logic layer
├── middleware/
│   └── validateDailyReport.js            # Validation middleware
├── routes/
│   └── dailyReport.route.js              # API routes
├── test_daily_report.mjs                 # Test suite
├── DAILY_REPORT_API.md                   # API documentation
└── server.js                             # Express server (updated)
```

---

## 🏗️ Architecture Layers

### 1. Model Layer (`models/DailyReport.js`)
**Responsibility:** Database schema and data validation

**Features:**
- MongoDB schema definition
- Field validation rules
- Unique date constraint
- Auto-calculated fields (totalSale, net)
- Pre-save hooks for calculations
- Timestamps (createdAt, updatedAt)

**Key Methods:**
- Pre-save hook to calculate `totalSale` and `net`

---

### 2. Service Layer (`services/dailyReport.service.js`)
**Responsibility:** Business logic and data manipulation

**Features:**
- Date normalization
- Report CRUD operations
- Date range queries
- Monthly reports
- Summary statistics calculation
- Reusable business logic

**Key Methods:**
```javascript
- normalizeDate(date)                           // Normalize to start of day
- calculateTotalSale(...)                       // Calculate total sale
- calculateNet(totalSale, expense)              // Calculate net amount
- saveReport(reportData)                        // Create or update report
- getAllReports()                               // Get all reports
- getReportByDate(date)                         // Get specific report
- getReportsByDateRange(start, end)             // Get range of reports
- getReportsByMonth(year, month)                // Get monthly reports
- deleteReport(date)                            // Delete report
- getSummaryStats(start, end)                   // Calculate statistics
- reportExists(date)                            // Check if report exists
```

---

### 3. Controller Layer (`controllers/dailyReport.controller.js`)
**Responsibility:** Handle HTTP requests and responses

**Features:**
- Request/response handling
- Error handling
- HTTP status codes
- Response formatting
- Delegates business logic to service layer

**Endpoints:**
```javascript
- saveDailyReport()          // POST /api/daily-report
- getAllDailyReports()       // GET /api/daily-report
- getDailyReportByDate()     // GET /api/daily-report/:date
- deleteDailyReport()        // DELETE /api/daily-report/:date
- getReportsByDateRange()    // GET /api/daily-report/range
- getReportsByMonth()        // GET /api/daily-report/month/:year/:month
- getSummaryStats()          // GET /api/daily-report/summary
```

---

### 4. Middleware Layer (`middleware/validateDailyReport.js`)
**Responsibility:** Request validation and sanitization

**Features:**
- Input validation
- Type checking
- Range validation
- Error messages
- Data sanitization

**Validators:**
```javascript
- validateDailyReport        // Validate report creation/update data
- validateDateParam          // Validate date URL parameter
- validateDateRange          // Validate date range query parameters
- validateMonthYear          // Validate month/year parameters
```

**Validation Rules:**
- Date must be valid
- Numeric fields must be >= 0
- Date range must be logical (start <= end)
- Month must be 1-12
- Year must be 2000-2100

---

### 5. Route Layer (`routes/dailyReport.route.js`)
**Responsibility:** API endpoint definitions

**Features:**
- Route definitions
- Middleware integration
- HTTP method mapping
- Path parameters

**Routes:**
```javascript
POST   /api/daily-report                          # Create/update report
GET    /api/daily-report                          # Get all reports
GET    /api/daily-report/summary                  # Get statistics
GET    /api/daily-report/range                    # Get date range
GET    /api/daily-report/month/:year/:month       # Get monthly reports
GET    /api/daily-report/:date                    # Get specific report
DELETE /api/daily-report/:date                    # Delete report
```

---

## 🔄 Request Flow

```
Client Request
    ↓
Express Router (routes/dailyReport.route.js)
    ↓
Validation Middleware (middleware/validateDailyReport.js)
    ↓
Controller (controllers/dailyReport.controller.js)
    ↓
Service Layer (services/dailyReport.service.js)
    ↓
Model/Database (models/DailyReport.js)
    ↓
Response to Client
```

---

## 📊 Data Model

### DailyReport Schema
```javascript
{
  date: {
    type: Date,
    required: true,
    unique: true,              // One report per day
  },
  cashInHand: Number,          // Default: 0
  cashSale: Number,            // Default: 0
  upi: Number,                 // Default: 0
  creditCard: Number,          // Default: 0
  creditNote: Number,          // Default: 0
  totalSale: Number,           // Auto-calculated
  expense: Number,             // Default: 0
  net: Number,                 // Auto-calculated
  timestamps: true             // createdAt, updatedAt
}
```

### Calculations
```javascript
totalSale = cashSale + upi + creditCard + creditNote
net = totalSale - expense
```

---

## 🧪 Testing

### Run Tests
```bash
cd backend
node test_daily_report.mjs
```

### Test Coverage
- ✅ Create daily report
- ✅ Update existing report
- ✅ Get all reports
- ✅ Get report by date
- ✅ Get reports by date range
- ✅ Get reports by month
- ✅ Get summary statistics
- ✅ Input validation
- ✅ Delete report

---

## 🔐 Security & Validation

### Input Validation
- All dates are validated
- Numeric fields checked for validity
- Negative values rejected
- Type checking enforced

### Data Sanitization
- Dates normalized to midnight
- Numbers parsed and validated
- Default values applied

### Error Handling
- Try-catch blocks in all controllers
- Proper HTTP status codes
- Detailed error messages
- Console logging for debugging

---

## 🚀 API Usage Examples

### Create a Report
```javascript
fetch('http://localhost:5000/api/daily-report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: '2026-01-31',
    cashInHand: 300,
    cashSale: 400,
    upi: 2,
    creditCard: 3,
    creditNote: 80,
    expense: 50
  })
});
```

### Get All Reports
```javascript
fetch('http://localhost:5000/api/daily-report')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Get Monthly Summary
```javascript
const start = '2026-01-01';
const end = '2026-01-31';
fetch(`http://localhost:5000/api/daily-report/summary?startDate=${start}&endDate=${end}`)
  .then(res => res.json())
  .then(data => console.log(data.data));
```

---

## 📝 Integration with Frontend

The backend is integrated with the frontend at:
- Frontend page: `/frontend/app/daily-report/page.tsx`
- API calls use: `${API_BASE_URL}/api/daily-report`

### Frontend Features
- Form to add/update daily reports
- Balance sheet table displaying all reports
- Real-time total calculation
- Success/error messages
- Auto-refresh after save

---

## 🔧 Maintenance

### Adding New Fields
1. Update model schema in `DailyReport.js`
2. Update calculations if needed
3. Update validation in `validateDailyReport.js`
4. Update service methods if needed
5. Update API documentation

### Adding New Endpoints
1. Create controller method
2. Add service method for business logic
3. Create validation middleware if needed
4. Add route in `dailyReport.route.js`
5. Update API documentation
6. Add test in `test_daily_report.mjs`

---

## 📚 Documentation
- Complete API documentation: `DAILY_REPORT_API.md`
- Test suite: `test_daily_report.mjs`
- This structure guide: Current file

---

## ✅ Production Checklist
- [x] Model with validation
- [x] Service layer with business logic
- [x] Controllers with error handling
- [x] Validation middleware
- [x] Complete route definitions
- [x] API documentation
- [x] Test suite
- [x] Frontend integration
- [x] Date normalization
- [x] Auto-calculations
- [x] Summary statistics
- [x] Monthly reports
- [x] Date range queries

---

## 🎯 Key Features
1. **Layered Architecture** - Separation of concerns
2. **Validation** - Input validation at multiple levels
3. **Auto-calculations** - Automatic total and net calculation
4. **Date Normalization** - Consistent date handling
5. **Comprehensive Queries** - Date ranges, monthly reports, statistics
6. **Error Handling** - Proper error responses
7. **Testing** - Complete test suite
8. **Documentation** - Detailed API docs

---

Last Updated: January 31, 2026
