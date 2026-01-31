const data = require('./shop_inventory.json');

const withStock = data.filter(item => item.net > 0);
console.log('Total items with stock:', withStock.length);

const grouped = {};
withStock.forEach(item => {
  if (!grouped[item.designNumber]) {
    grouped[item.designNumber] = new Set();
  }
  grouped[item.designNumber].add(item.color);
});

const multiColor = Object.entries(grouped)
  .filter(([dn, colors]) => colors.size > 1)
  .slice(0, 10);

console.log('\nDesigns with multiple colors:');
multiColor.forEach(([dn, colors]) => {
  console.log(`  ${dn}: ${Array.from(colors).join(', ')}`);
});

// Show a complete example
if (multiColor.length > 0) {
  const exampleDN = multiColor[0][0];
  console.log(`\nComplete example for ${exampleDN}:`);
  const items = withStock.filter(item => item.designNumber === exampleDN);
  items.forEach(item => {
    console.log(`  ${item.color} / ${item.size}: ${item.net} units (Import: ${item.import}, Return: ${item.return}, Sales: ${item.sales})`);
  });
}
