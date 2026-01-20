# Conditional Fields Implementation Guide

## Overview
This document describes the conditional fields added to the domestic warehouse page based on transaction form type.

## Conditional Fields by Form Type

### 1. **Dispatch** (`dispatch`)
- **Additional Field:** Receiver
- **Description:** Text input field to specify who receives the dispatched items

### 2. **Purchase** (`purchase`)
- **Additional Field:** Supplier
- **Description:** Text input field to specify the supplier of purchased items

### 3. **Transfer** (`transfer`)
- **Additional Fields:**
  - **Transfer Type:** Searchable dropdown (inwards/outwards)
  - **Receiver:** Text input field
  - **Channel:** Searchable dropdown (export/online)
- **Description:** Allows tracking of transfer direction, receiver, and destination channel

### 4. **Return** (`return`)
- **Additional Field:** Channel
- **Description:** Searchable dropdown with options:
  - domestic return
  - online return
  - export return
- **Functionality:** As you type, matching options appear first in the dropdown

### 5. **Sample** (`sample`)
- **Additional Field:** Receiver
- **Description:** Text input field to specify who receives the sample items

### 6. **Production** (`production`)
- **Additional Fields:** None (only basic fields: DNO, Type, Color, Size, Quantity, Date)

## Searchable Dropdown Features

The searchable dropdowns include advanced functionality:

1. **Auto-filtering:** As you type, options are filtered in real-time
2. **Smart sorting:** Options that start with your input appear first
3. **Click to select:** Click any option from the dropdown to select it
4. **Keyboard navigation:** Use Enter key to navigate through fields

## Implementation Details

### State Management
```typescript
const [channelOptions] = useState<string[]>([
  "export",
  "online",
  "domestic return",
  "online return",
  "export return",
]);

const [transferOptions] = useState<string[]>([
  "inwards",
  "outwards",
]);

const [filteredChannelOptions, setFilteredChannelOptions] = useState<string[]>(channelOptions);
const [filteredTransferOptions, setFilteredTransferOptions] = useState<string[]>(transferOptions);
const [showChannelDropdown, setShowChannelDropdown] = useState(false);
const [showTransferDropdown, setShowTransferDropdown] = useState(false);
```

### Filter Functions
- `handleChannelInputChange`: Filters and sorts channel options
- `handleTransferInputChange`: Filters and sorts transfer type options
- Both functions prioritize exact starts with matches

### Keyboard Navigation
- Press Enter to move to the next field
- On the last conditional field, Enter automatically saves the entry and creates a new blank form
- Maintains focus flow: DNO → Type → Color → Size → Qty → Date → Conditional Fields → Save

## Table Headers
The table headers dynamically adjust based on the selected form type:
- Only shows headers for fields that are relevant to the current transaction type
- Ensures clean, context-aware UI

## API Integration
All conditional fields are properly sent to the backend API:
- Fields are included in POST/PATCH requests when they have values
- Uses optional chaining (`...field && { field }`) to only send non-empty fields

## Testing Tips

1. **Test Dispatch:**
   - Select "dispatch" transaction type
   - Fill in basic fields
   - Add receiver name
   - Press Enter on receiver field to auto-save

2. **Test Transfer:**
   - Select "transfer" transaction type
   - Type "in" in Transfer Type field → "inwards" should appear first
   - Select from dropdown or type complete value
   - Add receiver and select channel (export/online)

3. **Test Return:**
   - Select "return" transaction type
   - Type "online" in Channel field → "online return" should appear first
   - Dropdown shows only return options (domestic return, online return, export return)

4. **Test Keyboard Navigation:**
   - Use Tab or Enter to navigate between fields
   - Verify auto-save works on the last field
   - Confirm new blank entry appears after save

## Files Modified
- `/workspaces/Inventory-Management-System/frontend/app/domestic/page.tsx`

## Changes Summary
1. Added `channel` field to Entry type and editForm state
2. Created searchable dropdown components with auto-filtering
3. Added conditional rendering for table headers
4. Implemented conditional field rendering in create/edit forms
5. Updated keyboard navigation to handle variable field counts
6. Enhanced handleSaveAndContinue to include all conditional fields
7. Added smart dropdown filtering with prioritized sorting
