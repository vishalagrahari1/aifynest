const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/utils/seedData.ts');
const fileContent = fs.readFileSync(filePath, 'utf8');

// Extract seedTools array
const startIdx = fileContent.indexOf('export const seedTools: Tool[] = [');
if (startIdx === -1) {
  console.log('Could not find seedTools start');
  process.exit(1);
}

// Find matching end bracket
const arrayStart = fileContent.indexOf('[', startIdx);
let depth = 0;
let arrayEnd = -1;
for (let i = arrayStart; i < fileContent.length; i++) {
  if (fileContent[i] === '[') depth++;
  else if (fileContent[i] === ']') {
    depth--;
    if (depth === 0) {
      arrayEnd = i + 1;
      break;
    }
  }
}

if (arrayEnd === -1) {
  console.log('Could not find seedTools end');
  process.exit(1);
}

const jsonText = fileContent.substring(arrayStart, arrayEnd);
try {
  const tools = JSON.parse(jsonText);
  console.log('Total seed tools:', tools.length);
  
  console.log('\n--- LAST 10 TOOLS ---');
  tools.slice(-10).forEach((t, i) => {
    const descWords = (t.description || '').split(/\s+/).filter(Boolean).length;
    console.log(`${tools.length - 10 + i + 1}. ID: ${t.id} | Name: ${t.name} | Description Words: ${descWords}`);
  });

  console.log('\n--- TOOLS WITH FEWER THAN 200 WORDS IN DESCRIPTION ---');
  const shortTools = [];
  tools.forEach((t, index) => {
    const descWords = (t.description || '').split(/\s+/).filter(Boolean).length;
    if (descWords < 200) {
      shortTools.push({ index, id: t.id, name: t.name, words: descWords });
    }
  });
  console.log(`Found ${shortTools.length} tools with < 200 words in description.`);
  console.log('Latest 10 among short tools:');
  shortTools.slice(-10).forEach(t => console.log(`Index ${t.index + 1} | ID: ${t.id} | Name: ${t.name} | Words: ${t.words}`));

} catch (err) {
  console.error('JSON Parse error:', err.message);
}
