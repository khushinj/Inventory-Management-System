const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./shop_inventory.json', 'utf-8'));
const map = new Map();

data.forEach(item => {
  const raw = item.designNumber;
  const norm = raw.trim().replace(/\s+/g, '').toUpperCase();
  
  if (!map.has(norm)) {
    map.set(norm, []);
  }
  
  map.get(norm).push({
    raw, 
    color: item.color, 
    size: item.size
  });
});

let foundSpacingDupes = 0;
const duplicates = [];

map.forEach((items, norm) => {
  const rawValues = [...new Set(items.map(i => i.raw))];
  if (rawValues.length > 1) {
    foundSpacingDupes++;
    duplicates.push({
      normalized: norm,
      variations: rawValues,
      totalEntries: items.length
    });
  }
});

console.log(`Found ${foundSpacingDupes} design numbers with spacing variations\n`);

duplicates.slice(0, 15).forEach(dup => {
  console.log(`\nNormalized: ${dup.normalized}`);
  console.log(`Variations found (${dup.variations.length}):`);
  dup.variations.forEach(v => console.log(`  - "${v}"`));
  console.log(`Total entries with this design: ${dup.totalEntries}`);
});

if (foundSpacingDupes > 15) {
  console.log(`\n... and ${foundSpacingDupes - 15} more ...`);
}

console.log(`\n\nTotal entries in inventory: ${data.length}`);
