# 🚀 Dashboard Performance Optimization Guide

## Overview
This guide outlines strategies to ensure all admin dashboard pages load quickly and perform efficiently.

## Current Status

### ✅ Already Optimized Pages
- **Domestic Dashboard** - Limited to 30 rows per view
- **Online Dashboard** - Limited to 30 rows per view  
- **Shop Dashboard** - Performance optimized

### 🎯 Pages to Optimize
- Domestic Analytics
- E-commerce Analytics
- Shop Analytics
- Analytics Page
- Export-FOB Analytics

---

## Key Optimization Strategies

### 1. Backend Query Optimization

#### Use `.lean()` for Read-Only Operations
```javascript
// ❌ Before - Returns full Mongoose documents
PurchaseOrder.find({}).sort({ date: -1 })

// ✅ After - Returns plain JSON objects (faster)
PurchaseOrder.find({}).sort({ date: -1 }).lean()
```

#### Select Only Required Fields
```javascript
// ❌ Before - Fetches all fields
PurchaseOrder.find({}).lean()

// ✅ After - Fetches only needed fields
PurchaseOrder.find({}).select('poc grandTotal date').lean()
```

#### Add Pagination/Limits
```javascript
// First 1000 documents only
PurchaseOrder.find({})
  .sort({ date: -1 })
  .limit(1000)
  .lean()
```

#### Optimize with Indexes
```javascript
// Ensure database indexes exist for these fields:
- date
- formType
- region
- poc
- status
```

---

### 2. Frontend Data Fetching Optimization

#### Use `Promise.all()` for Parallel Requests
```javascript
// ✅ Loads all data in parallel
const [res1, res2, res3, res4] = await Promise.all([
  api.get("/endpoint1"),
  api.get("/endpoint2"),
  api.get("/endpoint3"),
  api.get("/endpoint4"),
]);
```

#### Add Request Timeouts
```javascript
const response = await api.get("/endpoint", {
  timeout: 30000, // 30 seconds for data-heavy endpoints
});
```

#### Initial State Before Fetch
Display skeleton/loading state immediately while data loads in background.

---

### 3. Frontend Rendering Optimization

#### Use React.memo for Expensive Components
```typescript
const PieChart = React.memo(({ data }) => {
  // Component only re-renders if data changes
  return ...
});
```

#### Memoize Expensive Calculations
```javascript
// ✅ Use useMemo to cache calculations
const processedData = useMemo(() => {
  return data.map(item => expensive_calculation(item));
}, [data]);
```

#### Limit Chart Rendering
```javascript
// Only show first 8 items in pie chart, rest in legend
if (data.length > 8) {
  // Show legend only, not all slices
}
```

---

### 4. Limiting Data Display

#### Cap Table Rows
```typescript
// Show only last 30 rows
const displayRows = filteredRows.slice(0, 30);
```

#### Limit Chart Items
```typescript
// Top 10 items only
const topItems = items.slice(0, 10);
```

#### Virtual Scrolling for Large Lists
Consider implementing for 100+ item tables.

---

## Page-Specific Recommendations

### Domestic Analytics Page
**Current:** Fetches dispatch, purchase orders, inventory, job cards  
**Recommendation:** 
- Limit purchase orders to last 1000
- Limit inventory items to last 500
- Cache job cards (rarely changes)

### E-commerce Analytics Page
**Current:** Fetches online entries, inventory, job cards, daily reports  
**Recommendation:**
- Limit online entries to last 500
- Limit daily reports to date range only
- Memoize job card MRP map

### Shop Analytics Page
**Current:** Fetches daily reports, shop entries, inventory, job cards  
**Recommendation:**
- Limit shop entries to last 300
- Cache job cards result

### Analytics Dashboard Page
**Current:** Fetches recent activity, multiple data sources  
**Recommendation:**
- Limit recent activity to 100 rows
- Use pagination for activity feed

---

## Performance Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| Page Load Time | < 3 seconds | TBD |
| First Contentful Paint (FCP) | < 1.5s | TBD |
| DOM Elements | < 2000 | TBD |
| API Response Time | < 1s | TBD |
| Pie Chart Render | < 500ms | TBD |

---

## Implementation Checklist

### Backend
```
[ ] Add .lean() to all read operations
[ ] Add .select() for field selection
[ ] Add .limit() for data-heavy endpoints
[ ] Add indexes for sort fields
[ ] Set reasonable timeouts
[ ] Add response compression
```

### Frontend - Analytics Pages
```
[ ] Implement useMemo for calculations
[ ] Use React.memo for chart components
[ ] Add loading skeletons
[ ] Limit displayed rows/items
[ ] Implement request timeouts
[ ] Use Promise.all for parallel requests
[ ] Memoize expensive transformations
```

### Frontend - General
```
[ ] Lazy load components for each page/tab
[ ] Implement code splitting
[ ] Add service worker caching
[ ] Optimize image sizes
[ ] Minify JavaScript
[ ] Enable gzip compression
```

---

## Testing Performance

### 1. Chrome DevTools Performance Tab
- Open DevTools → Performance
- Record page load
- Identify bottlenecks

### 2. Network Tab Analysis
- Check request sizes
- Verify parallel loading
- Confirm response times

### 3. Real-World Testing
- Test on slower networks (3G)
- Test with large datasets
- Monitor memory usage

---

## Expected Improvements

| Change | Expected Improvement |
|--------|----------------------|
| Add .lean() queries | **20-30% faster** |
| Add field selection | **10-15% faster** |
| Add pagination | **40-50% faster** |
| Frontend memoization | **30-40% faster render** |
| Parallel API calls | **60-70% faster initial load** |
| Limit displayed rows | **50-60% faster rendering** |

---

## Quick Wins (Implement First)

1. ✅ **Add POC name normalization (DONE)**
2. 🎯 **Add .lean() to purchase order queries**
3. 🎯 **Add .lean() to job card queries**
4. 🎯 **Limit pie chart data to top 20 items**
5. 🎯 **Add useMemo to analytics calculations**
6. 🎯 **Set 30s timeout on analytics endpoints**
7. 🎯 **Cache job card responses** (rarely changes)

---

## References
- [Mongoose Query Optimization](https://mongoosejs.com/docs/tutorials/lean.html)
- [React Performance Optimization](https://reactjs.org/docs/optimizing-performance.html)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
