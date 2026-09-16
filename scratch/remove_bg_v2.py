import os
from PIL import Image
from collections import deque

src_path = r"C:\Users\Admin\.gemini\antigravity\brain\ba92285f-973c-472f-a845-324b033524a5\media__1789559962396.png"

img = Image.open(src_path).convert("RGBA")
w, h = img.size
print(f"Original image dimensions: {w}x{h}")

# 1. Flood fill from outer image borders to identify background
bg_mask = [[False]*h for _ in range(w)]
queue = deque()

for x in range(w):
    queue.append((x, 0))
    queue.append((x, h - 1))
    bg_mask[x][0] = True
    bg_mask[x][h - 1] = True
for y in range(h):
    queue.append((0, y))
    queue.append((w - 1, y))
    bg_mask[0][y] = True
    bg_mask[w - 1][y] = True

def is_white_bg(r, g, b, tol=35):
    return (255 - r) <= tol and (255 - g) <= tol and (255 - b) <= tol

while queue:
    cx, cy = queue.popleft()
    for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
        nx, ny = cx + dx, cy + dy
        if 0 <= nx < w and 0 <= ny < h and not bg_mask[nx][ny]:
            r, g, b, _ = img.getpixel((nx, ny))
            if is_white_bg(r, g, b, 35):
                bg_mask[nx][ny] = True
                queue.append((nx, ny))

# 2. Also mark enclosed white counters inside text letters (x > 300) as background
visited = set()
for x in range(300, w):
    for y in range(h):
        if not bg_mask[x][y] and (x, y) not in visited:
            r, g, b, _ = img.getpixel((x, y))
            if is_white_bg(r, g, b, 25):
                comp = []
                cq = deque([(x, y)])
                visited.add((x, y))
                while cq:
                    px, py = cq.popleft()
                    comp.append((px, py))
                    for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                        nx, ny = px + dx, py + dy
                        if 0 <= nx < w and 0 <= ny < h and not bg_mask[nx][ny] and (nx, ny) not in visited:
                            nr, ng, nb, _ = img.getpixel((nx, ny))
                            if is_white_bg(nr, ng, nb, 25):
                                visited.add((nx, ny))
                                cq.append((nx, ny))
                for px, py in comp:
                    bg_mask[px][py] = True

# 3. Create new image RGBA data
out_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
out_pixels = out_img.load()

for x in range(w):
    for y in range(h):
        r, g, b, a = img.getpixel((x, y))
        if bg_mask[x][y]:
            # Background pixel: calculate distance from white to handle edge antialiasing
            max_diff = max(255 - r, 255 - g, 255 - b)
            if max_diff < 5:
                # Fully transparent background
                out_pixels[x, y] = (255, 255, 255, 0)
            else:
                # Edge antialiasing: calculate alpha and unblend white background
                alpha_val = int((max_diff / 35.0) * 255)
                alpha_val = min(255, max(0, alpha_val))
                alpha_f = alpha_val / 255.0
                if alpha_f > 0:
                    unblend_r = int(min(255, max(0, (r - (1 - alpha_f) * 255) / alpha_f)))
                    unblend_g = int(min(255, max(0, (g - (1 - alpha_f) * 255) / alpha_f)))
                    unblend_b = int(min(255, max(0, (b - (1 - alpha_f) * 255) / alpha_f)))
                    out_pixels[x, y] = (unblend_r, unblend_g, unblend_b, alpha_val)
                else:
                    out_pixels[x, y] = (255, 255, 255, 0)
        else:
            # Foreground pixel (including white 'A' logo inside squircle and dark/orange letters)
            out_pixels[x, y] = (r, g, b, 255)

# 4. Crop image to tight bounding box of non-transparent content
bbox = out_img.getbbox()
if bbox:
    # Add a small padding around the logo
    pad = 8
    crop_box = (
        max(0, bbox[0] - pad),
        max(0, bbox[1] - pad),
        min(w, bbox[2] + pad),
        min(h, bbox[3] + pad)
    )
    cropped_img = out_img.crop(crop_box)
else:
    cropped_img = out_img

print(f"Cropped image size: {cropped_img.size}")

# 5. Save output to destination paths
dests = [
    r"C:\Users\Admin\.gemini\antigravity\scratch\ai-tools-directory\public\logo.png",
    r"C:\Users\Admin\.gemini\antigravity\scratch\ai-tools-directory\public\images\logo.png",
    r"C:\Users\Admin\.gemini\antigravity\scratch\ai-tools-directory\public\favicon.png"
]

for dest in dests:
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    cropped_img.save(dest, "PNG")
    print(f"Successfully saved transparent logo to {dest}")

print("Background removal v2 completed successfully.")
