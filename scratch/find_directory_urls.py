import os
import re

seed_path = r"src/utils/seedData.ts"
with open(seed_path, "r", encoding="utf-8") as f:
    text = f.read()

# Find all occurrences of aitoptools.com in seedData.ts
matches = re.findall(r'"name":\s*"([^"]+)"[\s\S]*?"websiteUrl":\s*"(https://aitoptools\.com/tool/[^"]+)"', text)

print(f"Total tools in seedData.ts with aitoptools.com websiteUrl: {len(matches)}")
for name, url in matches:
    print(f"  - {name:30} -> {url}")
