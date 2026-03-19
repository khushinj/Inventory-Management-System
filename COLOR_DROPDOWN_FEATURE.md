# Color Dropdown Feature Implementation

## Overview
This feature enables automatic color dropdown population based on jobcard design numbers across all entry forms in the Inventory Management System.

## How It Works

### 1. **Design Number Entry**
- User enters a design number in the "DNO" field
- When user presses **Tab**, **Enter**, or moves to the next field

### 2. **Automatic Color Lookup**
- The system queries the jobcard database using the design number
- API endpoint: `GET /api/jobcard/search?query={designNumber}`

### 3. **Color Display Logic**
- **If jobcard exists with colors**: Shows a dropdown with available colors from the jobcard's `cutting` array
- **If jobcard doesn't exist**: Shows a regular text input for manual color entry
- **Loading State**: Displays a "Loading colors..." message while fetching

## Components Created

### 1. **useJobCardColors Hook** (`frontend/app/hooks/useJobCardColors.ts`)
Custom React hook that manages the color lookup logic:
```typescript
- fetchColorsForDesignNumber(designNumber): Fetches colors from jobcard API
- colorOptions: Array of available colors
- hasJobCard: Boolean indicating if jobcard was found
- loading: Loading state
- error: Error message if any
- resetColors(): Clears color data
```

### 2. **ColorInput Component** (`frontend/app/components/ColorInput.tsx`)
Reusable component that automatically switches between:
- **Dropdown select**: When jobcard colors are available
- **Text input**: When no jobcard colors are found

Features:
- Shows color count from jobcard
- Handles both keyboard and selection input
- Supports all standard input props (className, placeholder, etc.)

## Updated Pages

### 1. **Shop Dashboard** (`frontend/app/shop/page.tsx`)
- ✅ Import form - Color dropdown for DNO with jobcard colors
- ✅ Sales form - Color dropdown for DNO with jobcard colors  
- ✅ Return form - Color dropdown for DNO with jobcard colors
- Hooks: `importColorHook`, `salesColorHook`, `returnColorHook`

### 2. **Domestic Dashboard** (`frontend/app/domestic/page.tsx`)
- ✅ Sample form - Color dropdown for DNO with jobcard colors
- ✅ Production form - Color dropdown for DNO with jobcard colors
- ✅ Purchase form - Color dropdown for DNO with jobcard colors
- ✅ Dispatch form - Color dropdown for DNO with jobcard colors
- ✅ Regular form (transfer/return) - Color dropdown for DNO with jobcard colors
- Hooks: `sampleColorHook`, `productionColorHook`, `purchaseColorHook`, `dispatchColorHook`, `regularFormColorHook`

### 3. **Domestic-Online-Sales Page** (`frontend/app/domestic-online-sales/page.tsx`)
- ✅ Sales form - Color dropdown for DNO with jobcard colors
- Hooks: `colorHook`

### 4. **Online Dashboard** (`frontend/app/online/page.tsx`)
- ✅ Imports updated for hooks and ColorInput component
- Ready for integration (similar pattern to Domestic page)

## Key Features

### 1. **Automatic Lookup on Tab/Enter**
```typescript
if (e.key === 'Enter' || e.key === 'Tab') {
  colorHook.fetchColorsForDesignNumber(designNumber);
}
```

### 2. **Smart Color Display**
- **With Jobcard**: Dropdown shows all colors from jobcard's cutting array
- **Without Jobcard**: Regular text input for manual entry
- **Loading**: Graceful loading state message

### 3. **Seamless Integration**
- Works with existing keyboard navigation (Tab/Enter)
- Maintains form field focus management
- No breaking changes to existing UI

## User Experience Flow

```
User enters Design Number (e.g., "DN001")
         ↓
User presses Tab or Enter
         ↓
System fetches jobcard for DN001
         ↓
Jobcard found? 
         ├─ YES → Show dropdown with colors (Red, Blue, Green, etc.)
         └─ NO → Show text input for manual entry
         ↓
User selects color from dropdown or types manually
         ↓
Continue filling other fields
```

## API Integration

The feature uses the existing jobcard API:
- **Endpoint**: `GET /api/jobcard/search`
- **Query Parameter**: `query={designNumber}`
- **Response**: Array of matching jobcards with `cutting` array containing colors

Example Response:
```json
{
  "designNumber": "DN001",
  "brand": "Brand A",
  "cutting": [
    { "color": "Red", "quantity": 10 },
    { "color": "Blue", "quantity": 20 },
    { "color": "Green", "quantity": 15 }
  ]
}
```

## Technical Details

### Hook State Management
```typescript
- colorOptions: ColorOption[] (color + quantity pairs)
- loading: boolean
- error: string | null
- hasJobCard: boolean
```

### Component Props
```typescript
interface ColorInputProps {
  value: string
  onChange: (value: string) => void
  colorOptions: ColorOption[]
  hasJobCard: boolean
  loading?: boolean
  placeholder?: string
  className?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
}
```

## Testing Checklist

- [ ] Shop Import Form: Enter DNO with jobcard → Colors appear in dropdown
- [ ] Shop Sales Form: Enter DNO without jobcard → Text input shows  
- [ ] Domestic Sample Form: Tab from DNO → Color dropdown loads
- [ ] Domestic Production Form: Press Enter on DNO → Moves to color field with dropdown
- [ ] Online Sales Form: Multiple DNOs with different color options
- [ ] Edit mode: Existing entries maintain color functionality
- [ ] Error handling: Invalid DNO shows text input (manual entry)
- [ ] Keyboard navigation: Tab/Enter properly triggers color lookup

## Benefits

1. **Data Consistency**: Colors come from central jobcard database
2. **User Efficiency**: Reduces typing errors with pre-populated colors
3. **Flexibility**: Manual entry still available for DNOs without jobcards
4. **User Experience**: Seamless integration with existing workflows
5. **Performance**: Async loading doesn't block user interaction

## Future Enhancements

1. Add color search/filter in dropdown
2. Show color quantity information
3. Add color preview (color swatch)
4. Cache color lookups for performance
5. Add bulk import with pre-populated colors
