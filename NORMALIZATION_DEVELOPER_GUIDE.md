# Design Number Normalization - Developer Guide

## Quick Reference

### Using the Normalization Utility

```javascript
import { 
  normalizeDesignNumber, 
  normalizeColor, 
  normalizeSize, 
  createInventoryKey,
  isValidDesignNumber 
} from './utils/normalization.js';

// Normalize a single design number
const normalizedDno = normalizeDesignNumber('NGW - 351236 A');
// Result: 'NGW-351236A'

// Normalize color
const normalizedColor = normalizeColor('  Red  ');
// Result: 'RED'

// Normalize size
const normalizedSize = normalizeSize('  XL  ');
// Result: 'XL'

// Create a composite key for grouping
const key = createInventoryKey('NGW - 351236 A', '  Red  ', '  XL  ');
// Result: 'NGW-351236A|RED|XL'

// Check if design number is valid
if (isValidDesignNumber(dno)) {
  // Process the design number
}
```

### Using the Middleware

The middleware is already applied to all key routes:

```javascript
import { normalizeDesignNumberAll } from './middleware/normalizeDesignNumber.js';

// In your route file:
router.use(normalizeDesignNumberAll);

// Now all incoming requests have normalized design numbers:
// req.query.designNumber, req.params.dno, req.body.dno will all be normalized
```

### In Services

```javascript
import { normalizeDesignNumber } from '../utils/normalization.js';

// When processing inventory items:
const normalizedDno = normalizeDesignNumber(item.dno);

// Use as key in maps/objects:
const key = `${normalizedDno}|${color}|${size}`;
const inventoryMap = new Map();
inventoryMap.set(key, itemData);

// For database queries, normalize the search term:
const searchTerm = normalizeDesignNumber(userInput);
```

## Important Points

### ✅ DO:
- ✅ Use `normalizeDesignNumber()` when comparing design numbers
- ✅ Use normalized values when creating composite keys
- ✅ Use the middleware on all routes that handle design numbers
- ✅ Normalize user input before storing or comparing

### ❌ DON'T:
- ❌ Compare design numbers directly without normalizing
- ❌ Create keys without normalization
- ❌ Store un-normalized design numbers in composite keys
- ❌ Assume spacing differences don't matter

## Examples

### Good ✅
```javascript
// Searching for design numbers
const search = normalizeDesignNumber(req.query.search);
const results = inventory.filter(item => 
  normalizeDesignNumber(item.dno).includes(search)
);

// Merging inventory
const key = `${normalizeDesignNumber(item.dno)}|${normalizeColor(item.color)}`;
if (map.has(key)) {
  // Merge with existing
  map.get(key).qty += item.qty;
}
```

### Bad ❌
```javascript
// Direct comparison without normalization
if (item.dno === userInput) {
  // This will fail if there are spacing differences
}

// Un-normalized key creation
const key = `${item.dno}|${item.color}|${item.size}`;
// Design numbers with spacing variations create different keys

// Comparing with spaces
if ('NG - 19397' === 'NG-19397') {
  // This is false, but should be true!
}
```

## Normalization Rules

### Design Numbers
- **Remove**: All whitespace
- **Convert**: To uppercase
- **Special Cases**:
  - `"aaw-xxx"` → `"aw-xxx"` (removes duplicate 'a' prefix)

### Colors
- **Remove**: Extra spaces (normalize to single spaces)
- **Convert**: To uppercase
- **Format**: `"RED MEL."` stays as `"RED MEL."` (single spaces preserved)

### Sizes
- **Remove**: Whitespace
- **Convert**: To uppercase
- **Valid**: XS, S, M, L, XL, XXL, 3XL, 4XL, 5XL

## Data Migration

The `dedup_inventory.mjs` script handles:
- ✅ Merging duplicate entries (same design number, color)
- ✅ Combining quantities from duplicates
- ✅ Creating backups of original files
- ✅ Saving deduplicated data

Run with:
```bash
node dedup_inventory.mjs
```

## Testing

### Unit Test Example
```javascript
import { normalizeDesignNumber } from './backend/utils/normalization.js';

describe('Design Number Normalization', () => {
  test('should remove spaces', () => {
    expect(normalizeDesignNumber('NGW - 351236 A')).toBe('NGW-351236A');
  });

  test('should uppercase', () => {
    expect(normalizeDesignNumber('ng-19397')).toBe('NG-19397');
  });

  test('should handle special cases', () => {
    expect(normalizeDesignNumber('aaw-85089')).toBe('AW-85089');
  });
});
```

## FAQ

**Q: What if a design number is null/undefined?**
A: Returns empty string `''`

**Q: Does normalization change the stored data?**
A: Only when used for comparison/grouping. Original data remains unchanged unless explicitly saved.

**Q: Can I still search with spacing?**
A: Yes! The middleware normalizes search input, so spacing doesn't matter.

**Q: What about backward compatibility?**
A: Fully backward compatible. Old API calls work seamlessly.

**Q: How do I disable normalization?**
A: Don't include the middleware in the route or don't call the normalization functions.
