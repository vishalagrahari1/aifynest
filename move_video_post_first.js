const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, 'src', 'utils', 'seedData.ts');
let content = fs.readFileSync(seedPath, 'utf8');

const postStartMarker = "    slug: 'best-ai-video-editing-tools-2026',";
const itemStartIndex = content.lastIndexOf("  {", content.indexOf(postStartMarker));
const itemEndIndex = content.indexOf("  }", content.indexOf("readTime: '14 min read'")) + 3;

if (itemStartIndex === -1 || itemEndIndex === -1) {
  console.error("Could not find start or end index of video editing post");
  process.exit(1);
}

const videoPostBlock = content.substring(itemStartIndex, itemEndIndex);

// Remove the videoPostBlock from its current location
// Note: handle preceding comma if necessary
let newContent = content.substring(0, itemStartIndex) + content.substring(itemEndIndex);
// Fix any double commas or extra comma before `];`
newContent = newContent.replace(/,\s*,/g, ',').replace(/,\s*\];/g, '\n];');

// Insert videoPostBlock at the top of initialBlogPosts array
const arrayStartMarker = "export const initialBlogPosts: BlogPost[] = [\n";
const arrayStartIdx = newContent.indexOf(arrayStartMarker);

if (arrayStartIdx === -1) {
  console.error("Could not find arrayStartMarker");
  process.exit(1);
}

const insertPos = arrayStartIdx + arrayStartMarker.length;
const updatedContent = newContent.substring(0, insertPos) + videoPostBlock + ",\n" + newContent.substring(insertPos);

fs.writeFileSync(seedPath, updatedContent, 'utf8');
console.log("Successfully moved best-ai-video-editing-tools-2026 to top of initialBlogPosts!");
