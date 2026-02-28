const fs = require('fs');
const path = require('path');

const dataDir = './backend/data';
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
  console.log(`\n=== Checking ${file} ===`);
  try {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
    const map = new Map();
    
    data.forEach(item => {
      const dno = item.dno || '';
      const norm = dno.trim().replace(/\s+/g, '').toUpperCase();
      if (!map.has(norm)) {
        map.set(norm, []);
      }
      map.get(norm).push(dno);
    });
    
    let count = 0;
    const examples = [];
    
    map.forEach((vals, norm) => {
      const unique = [...new Set(vals)];
      if (unique.length > 1) {
        count++;
        if (examples.length < 5) {
          examples.push({
            normalized: norm,
            variations: unique
          });
        }
      }
    });
    
    console.log(`Total with spacing variations: ${count}`);
    if (examples.length > 0) {
      examples.forEach(ex => {
        console.log(`\n  Normalized: ${ex.normalized}`);
        console.log(`  Variations: ${ex.variations.join(' | ')}`);
      });
    }
  } catch (error) {
    console.log(`Error reading file: ${error.message}`);
  }
});
