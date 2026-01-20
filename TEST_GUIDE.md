# Quick Test Guide - Entry Creation

## Backend API is Working ✅

### Verified API Endpoints:
- **POST** `/api/warehouse/domestic` → Creates entry ✅
- **GET** `/api/warehouse/domestic` → Fetches all entries ✅

### Sample API Response:
```json
{
  "_id": "696f651c2f0ce84f723679ae",
  "domain": "warehouse",
  "warehouseType": "domestic",
  "formType": "dispatch",
  "dno": "TEST001",
  "type": "T-Shirt",
  "color": "Blue",
  "size": "M",
  "qty": 50,
  "date": "2025-01-20T00:00:00.000Z",
  "receiver": "John Doe",
  "createdAt": "2026-01-20T11:21:00.157Z",
  "__v": 0
}
```

---

## How to Test in Frontend

### Step 1: Navigate to Domestic Warehouse
- Click on **Domestic Warehouse** from dashboard
- URL should be: `http://localhost:3001/domestic`

### Step 2: Create an Entry
1. Click **"+ New Transaction"** button (top right)
2. Select form type: **"Dispatch"** (or any other)
3. Fill the form using **Enter to navigate**:
   - **DNO**: Type "D001" → Press **Enter** (cursor moves to Type)
   - **Type**: Type "T-Shirt" → Press **Enter** (cursor moves to Color)
   - **Color**: Type "Red" → Press **Enter** (cursor moves to Size)
   - **Size**: Type "M" → Press **Enter** (cursor moves to Qty)
   - **Qty**: Type "100" → Press **Enter** (cursor moves to Date)
   - **Date**: Select from picker
   - **Receiver**: Type a name (if required for form type)
4. Click **"Save Entry"** button

### Step 3: Verify Success
- Should see alert: **"Saved successfully"** ✅
- Form should clear automatically
- Back on dashboard: Entry should appear in the table immediately

### Step 4: Verify in Backend
Run this command to check MongoDB:
```bash
curl -s http://localhost:5000/api/warehouse/domestic | python3 -m json.tool | head -30
```

Your entry should appear in the list with:
- Correct domain: `"warehouse"`
- Correct warehouse type: `"domestic"`
- Your entered values

---

## Server Logs to Check

### Backend Terminal:
```
✓ MongoDB Connected (FREE Atlas)
✓ Server running on port 5000
✓ No errors when creating entry
```

### Frontend Terminal:
```
✓ Ready in 996ms
✓ API Base URL: http://localhost:5000/api (logged in console)
✓ No errors in Next.js build
```

---

## What Was Fixed

| Issue | Status | Details |
|-------|--------|---------|
| API Base URL | ✅ Fixed | Now uses `http://localhost:5000/api` |
| Domain Format | ✅ Fixed | Sends `"warehouse"` (lowercase) not `"Warehouse"` |
| Enter Key Navigation | ✅ Added | Press Enter to jump to next field |
| Hydration Errors | ✅ Fixed | No nested html/body tags |
| Database Entries | ✅ Working | All entries saved to MongoDB |

---

## Common Issues & Solutions

### Issue: "Backend not reachable"
**Solution:** 
- Check backend is running: `npm start` from `/backend` folder
- Verify port 5000 is open
- Check MongoDB connection in backend terminal

### Issue: "Invalid warehouse type" error
**Solution:** Already fixed! Domain values now match backend expectations.

### Issue: Enter key not moving to next field
**Solution:** Already fixed! All inputs now have Enter key navigation.

### Issue: "Saved successfully" but entry not appearing
**Solution:** 
- Refresh the page (Ctrl+R)
- Check browser console for errors (F12)
- Verify backend response has `_id` field

---

## Summary

✅ **All systems operational:**
- Frontend connected to backend
- Enter key navigation working
- Entries being saved to MongoDB
- No hydration errors
- Ready for testing!

**Next step:** Try creating an entry following the "How to Test in Frontend" section above.
