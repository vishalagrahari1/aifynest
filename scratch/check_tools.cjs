const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/utils/seedData.ts');
const fileContent = fs.readFileSync(filePath, 'utf8');

const startPos = fileContent.indexOf('export const initialTools: Tool[] = [');
const endPos = fileContent.indexOf('export const initialReviews: Review[] = [');

let code = fileContent.substring(startPos, endPos);
code = code.replace('export const initialTools: Tool[] =', 'var initialTools =');

eval(code);

console.log('=== TOOLS WITH LESS THAN 200 WORDS ===');
initialTools.forEach((t, i) => {
  const words = (t.description || '').trim().split(/\s+/).filter(Boolean).length;
  if (words < 200) {
    console.log(`Index: ${i + 1} | ID: ${t.id} | Name: ${t.name} | Current Words: ${words}`);
  }
});
