const fs = require('fs');
const filePath = 'src/utils/seedData.ts';
let code = fs.readFileSync(filePath, 'utf8');

const newSlugs = ['h1btrends', 'huffl', 'newsletrix', 'celebifyai', 'celebifyai-net'];

newSlugs.forEach(slug => {
  const slugStr = `"slug": "${slug}"`;
  const idx = code.indexOf(slugStr);
  if (idx !== -1) {
    const blockEnd = code.indexOf('},', idx);
    let block = code.substring(idx, blockEnd);
    
    // Replace approvedAt and lastUpdated with newest timestamp
    block = block.replace(/"approvedAt":\s*"[^"]+"/, '"approvedAt": "2026-10-10T13:50:00.000Z"');
    block = block.replace(/"lastUpdated":\s*"[^"]+"/, '"lastUpdated": "2026-10-10T13:50:00.000Z"');

    code = code.substring(0, idx) + block + code.substring(blockEnd);
  }
});

fs.writeFileSync(filePath, code, 'utf8');
console.log('Updated timestamps for all 5 new tools in seedData.ts');
