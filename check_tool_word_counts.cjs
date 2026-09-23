const fs = require('fs');
const path = require('path');

const seedDataPath = path.join(__dirname, 'src', 'utils', 'seedData.ts');
const fileContent = fs.readFileSync(seedDataPath, 'utf8');

// Parse tools array using simple match or eval by converting TS to JS in memory
// Extract tools array from seedData.ts
const toolsMatch = fileContent.match(/export const initialTools: Tool\[\] = (\[[\s\S]*?\]);/);

if (!toolsMatch) {
  console.error("Could not find initialTools array in seedData.ts");
  process.exit(1);
}

// Convert typescript objects to JS executable array
let toolsStr = toolsMatch[1];

// We can evaluate toolsStr safely using Function or VM
try {
  const getTools = new Function(`return ${toolsStr};`);
  const initialTools = getTools();

  console.log(`Total tools in seedData.ts: ${initialTools.length}`);

  let shortCount = 0;
  const shortTools = [];

  initialTools.forEach(tool => {
    const desc = tool.description || '';
    const wordCount = desc.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 200) {
      shortCount++;
      shortTools.push({
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        categorySlug: tool.categorySlug,
        tagline: tool.tagline,
        wordCount: wordCount,
        descPreview: desc.slice(0, 100) + '...'
      });
    }
  });

  console.log(`Tools with description < 200 words: ${shortCount} out of ${initialTools.length}`);
  console.log('\nList of tools needing expansion (< 200 words):');
  shortTools.forEach((t, i) => {
    console.log(`${i + 1}. [${t.slug}] ${t.name} (${t.wordCount} words) - Category: ${t.categorySlug}`);
  });

} catch (err) {
  console.error("Error evaluating tools array:", err);
}
