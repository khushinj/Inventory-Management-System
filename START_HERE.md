# 🚀 Quick Start Commands

## Setup (One Time)

```bash
# Navigate to project
cd /workspaces/Inventory-Management-System

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

---

## Start the System

### Terminal 1: Backend
```bash
cd /workspaces/Inventory-Management-System/backend
npm start
```

**Expected Output:**
```
✓ MongoDB Connected (FREE Atlas)
✓ Server running on port 5000
```

### Terminal 2: Frontend
```bash
cd /workspaces/Inventory-Management-System/frontend
npm run dev
```

**Expected Output:**
```
✓ Ready in 996ms
✓ Local: http://localhost:3001
```

### Terminal 3: Browser
```
Open: http://localhost:3001
```

---

## Create Your First Entry

### Step-by-Step in Browser

1. **Click "Domestic Warehouse"**
   ```
   URL: http://localhost:3001/domestic
   ```

2. **Click "+ New Transaction"** (top right button)

3. **Select "Dispatch"** form type

4. **Fill the form** (using Enter key to navigate):
   ```
   DNO:      D001        → Press ENTER
   Type:     T-Shirt     → Press ENTER
   Color:    Blue        → Press ENTER
   Size:     M           → Press ENTER
   Qty:      100         → Press ENTER
   Date:     (pick date with calendar)
   Receiver: John Doe    (if shown)
   ```

5. **Click "Save Entry"**

6. **You should see:**
   - ✅ "Saved successfully" alert
   - ✅ Form clears
   - ✅ Entry appears in table below

---

## Verify in Terminal

```bash
# Check entry was saved in MongoDB
curl -s http://localhost:5000/api/warehouse/domestic | python3 -m json.tool
```

**You should see your entry with:**
```json
{
  "_id": "some-id",
  "domain": "warehouse",
  "warehouseType": "domestic",
  "formType": "dispatch",
  "dno": "D001",
  "type": "T-Shirt",
  "color": "Blue",
  "size": "M",
  "qty": 100,
  "date": "2026-01-20T00:00:00.000Z",
  "receiver": "John Doe"
}
```

---

## Test All Features

### Create in Other Warehouses
```bash
# Click "Export Warehouse"
# Click "+ New Transaction"
# Select form type and fill
# Save and verify

# Click "Online Warehouse"
# Click "+ New Transaction"
# Select form type and fill
# Save and verify

# Click "Shop"
# Click "+ New Transaction"
# Select form type and fill
# Save and verify
```

### Test Edit
```
1. Click edit icon (pencil) on any entry
2. Modify some values
3. Click "Save"
4. Verify changes appear in table
```

### Test Delete
```
1. Click delete icon (trash) on any entry
2. Confirm deletion
3. Verify entry is removed
```

### Test Enter Key Navigation
```
1. Click on DNO field
2. Type something
3. Press ENTER → cursor moves to Type field ✅
4. Continue pressing ENTER to move through fields
```

---

## API Testing

### Get all domestic entries
```bash
curl http://localhost:5000/api/warehouse/domestic
```

### Get all export entries
```bash
curl http://localhost:5000/api/warehouse/export
```

### Get all online entries
```bash
curl http://localhost:5000/api/warehouse/online
```

### Get all shop entries
```bash
curl http://localhost:5000/api/shop
```

### Create a domestic entry
```bash
curl -X POST http://localhost:5000/api/warehouse/domestic \
  -H "Content-Type: application/json" \
  -d '{
    "dno": "API001",
    "type": "Test",
    "qty": 50,
    "date": "2026-01-20",
    "formType": "dispatch",
    "receiver": "Test Receiver",
    "domain": "warehouse",
    "warehouseType": "domestic"
  }'
```

### Update an entry
```bash
curl -X PATCH http://localhost:5000/api/warehouse/domestic/[ID] \
  -H "Content-Type: application/json" \
  -d '{
    "qty": 75
  }'
```

### Delete an entry
```bash
curl -X DELETE http://localhost:5000/api/warehouse/domestic/[ID]
```

*(Replace [ID] with actual entry ID from database)*

---

## Quick Troubleshooting

### Port already in use?
```bash
# Kill process on port 5000
lsof -i :5000
kill -9 [PID]

# Kill process on port 3001
lsof -i :3001
kill -9 [PID]
```

### Clear Next.js cache
```bash
rm -rf /workspaces/Inventory-Management-System/frontend/.next
npm run dev
```

### View backend logs
```bash
# Look at backend terminal - MongoDB and server logs
```

### View frontend logs
```bash
# Open browser Developer Tools
# Press F12 → Console tab
```

### Check MongoDB connection
```bash
# Backend terminal should show:
# "MongoDB Connected (FREE Atlas)"
```

---

## Commands Cheat Sheet

```bash
# Start backend
cd backend && npm start

# Start frontend
cd frontend && npm run dev

# Test backend health
curl http://localhost:5000

# Get all entries
curl http://localhost:5000/api/warehouse/domestic

# Format JSON response
curl http://localhost:5000/api/warehouse/domestic | python3 -m json.tool

# Count entries
curl -s http://localhost:5000/api/warehouse/domestic | python3 -c "import sys, json; print(len(json.load(sys.stdin)))"

# Kill backend
pkill -f "node.*server.js"

# Kill frontend
pkill -f "next dev"
```

---

## Expected File Locations

```
/workspaces/Inventory-Management-System/
├── backend/
│   ├── server.js               (Main backend file)
│   ├── .env                    (Config - has MongoDB URI)
│   ├── controllers/            (Route handlers)
│   ├── models/                 (Database schemas)
│   └── routes/                 (API endpoints)
├── frontend/
│   ├── app/
│   │   ├── components/         (React components)
│   │   ├── domestic/           (Warehouse pages)
│   │   ├── export/
│   │   ├── online/
│   │   └── shop/
│   ├── lib/
│   │   └── api.tsx             (API configuration)
│   └── .env.local              (Frontend config)
└── QUICK_START.md              (This file)
```

---

## Success Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3001
- [ ] Can open http://localhost:3001
- [ ] Dashboard loads without errors
- [ ] Can navigate to Domestic warehouse
- [ ] Can create a new entry
- [ ] Can use Enter key to move between fields
- [ ] Entry saves successfully
- [ ] Entry appears in table
- [ ] Can verify entry via API call
- [ ] No errors in browser console
- [ ] No errors in backend console

---

## Next Steps

1. ✅ Run backend: `cd backend && npm start`
2. ✅ Run frontend: `cd frontend && npm run dev`
3. ✅ Open: http://localhost:3001
4. ✅ Create entry in Domestic warehouse
5. ✅ Verify entry in API response
6. ✅ Test other warehouses
7. ✅ Test edit/delete operations

---

**That's it! System is ready to use.** 🎉

If you encounter any issues, check the troubleshooting section above or review the detailed documentation files.
