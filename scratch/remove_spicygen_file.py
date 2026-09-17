import os

seed_path = r"src/utils/seedData.ts"
with open(seed_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Locate the object starting with "id": "tool-spicygen"
start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if '"id": "tool-spicygen"' in line:
        # Find opening brace '{' above
        for j in range(i, max(0, i-5), -1):
            if '{' in lines[j]:
                start_idx = j
                break
        # Find closing brace '}' below
        for k in range(i, min(len(lines), i+80)):
            if '}' in lines[k] and (k+1 >= len(lines) or ',' in lines[k] or lines[k+1].strip().startswith('{') or lines[k+1].strip().startswith(']')):
                end_idx = k
                # If there is a trailing comma, include it
                if k+1 < len(lines) and ',' in lines[k+1]:
                    end_idx = k + 1
                break
        break

print(f"Found SpicyGen block from line {start_idx+1 if start_idx else 'None'} to {end_idx+1 if end_idx else 'None'}")

if start_idx is not None and end_idx is not None:
    new_lines = lines[:start_idx] + lines[end_idx+1:]
    with open(seed_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    print("Successfully removed SpicyGen from seedData.ts!")
else:
    print("SpicyGen block not found.")
