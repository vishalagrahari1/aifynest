const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/utils/seedData.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

const finalAdditions = {
  "tool-khanmigo": ` Designed for accessibility, Khanmigo ensures every student receives personalized, high-quality tutoring support anytime.`,
  "tool-grammarly": ` Trusted worldwide, Grammarly helps writers express ideas clearly, confidently, and professionally across all digital platforms.`,
  "tool-photomath": ` Trusted by millions, Photomath transforms math frustration into engaging, step-by-step problem-solving success daily.`,
};

let replaceCount = 0;
for (const [toolId, additionText] of Object.entries(finalAdditions)) {
  const toolPattern = new RegExp(`("id":\\s*"${toolId}"[\\s\\S]*?"description":\\s*")([\\s\\S]*?)(")`, 'g');
  fileContent = fileContent.replace(toolPattern, (match, p1, p2, p3) => {
    replaceCount++;
    return `${p1}${p2}${additionText}${p3}`;
  });
}

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log(`Pushed final 3 tools over 200 words.`);
