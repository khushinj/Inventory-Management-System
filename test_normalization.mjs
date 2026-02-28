import { normalizeDesignNumber, normalizeColor, normalizeSize, createInventoryKey, isValidDesignNumber } from './backend/utils/normalization.js';

console.log('✅ Normalization utility loaded successfully!\n');

// Test the functions
console.log('Testing normalization functions:\n');

const testCases = [
  { input: 'NGW - 351236 A', expected: 'NGW-351236A', type: 'design number' },
  { input: 'aaw-85089', expected: 'AW-85089', type: 'design number with special case' },
  { input: '  NG - 19397  ', expected: 'NG-19397', type: 'design with extra spaces' },
  { input: '  RED  ', expected: 'RED', type: 'color' },
  { input: '  XL  ', expected: 'XL', type: 'size' },
];

testCases.forEach(test => {
  let result;
  if (test.type.includes('color')) {
    result = normalizeColor(test.input);
  } else if (test.type.includes('size')) {
    result = normalizeSize(test.input);
  } else {
    result = normalizeDesignNumber(test.input);
  }
  
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} ${test.type}`);
  console.log(`   Input:    "${test.input}"`);
  console.log(`   Expected: "${test.expected}"`);
  console.log(`   Got:      "${result}"\n`);
});

// Test composite key creation
console.log('Testing composite key creation:\n');
const key = createInventoryKey('NGW - 351236 A', '  RED  ', '  XL  ');
const expectedKey = 'NGW-351236A|RED|XL';
const status = key === expectedKey ? '✅' : '❌';
console.log(`${status} Composite key creation`);
console.log(`   Expected: "${expectedKey}"`);
console.log(`   Got:      "${key}"\n`);

// Test validation
console.log('Testing validation:\n');
const validDno = 'NG-19397';
const invalidDno = '';
console.log(`✅ Valid design number: ${isValidDesignNumber(validDno)}`);
console.log(`✅ Invalid design number: ${isValidDesignNumber(invalidDno)}`);
