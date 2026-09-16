import os
from PIL import Image

src_path = r"C:\Users\Admin\.gemini\antigravity\brain\ba92285f-973c-472f-a845-324b033524a5\media__1789559962396.png"

img = Image.open(src_path).convert("RGBA")
w, h = img.size
print(f"Source image dimensions: {w}x{h}")

datas = img.getdata()
newData = []

# Process all pixels: convert any white/near-white pixel (including the white 'A' logo) to transparent
for item in datas:
    r, g, b, a = item
    # Check closeness to pure white (255, 255, 255)
    max_diff = max(255 - r, 255 - g, 255 - b)
    
    if max_diff < 5:
        # Pure white -> transparent
        newData.append((255, 255, 255, 0))
    elif max_diff < 40:
        # Antialiased fringe: blend alpha smoothly
        alpha_val = int((max_diff / 40.0) * 255)
        alpha_val = min(255, max(0, alpha_val))
        alpha_f = alpha_val / 255.0
        if alpha_f > 0:
            unblend_r = int(min(255, max(0, (r - (1 - alpha_f) * 255) / alpha_f)))
            unblend_g = int(min(255, max(0, (g - (1 - alpha_f) * 255) / alpha_f)))
            unblend_b = int(min(255, max(0, (b - (1 - alpha_f) * 255) / alpha_f)))
            newData.append((unblend_r, unblend_g, unblend_b, alpha_val))
        else:
            newData.append((255, 255, 255, 0))
    else:
        # Keep non-white colors (orange squircle, dark blue text, orange sparkles/text)
        newData.append(item)

out_img = Image.new("RGBA", (w, h))
out_img.putdata(newData)

# Tight crop of the logo
bbox = out_img.getbbox()
if bbox:
    pad = 6
    crop_box = (
        max(0, bbox[0] - pad),
        max(0, bbox[1] - pad),
        min(w, bbox[2] + pad),
        min(h, bbox[3] + pad)
    )
    cropped_logo = out_img.crop(crop_box)
else:
    cropped_logo = out_img

cw, ch = cropped_logo.size
print(f"Cropped logo dimensions: {cw}x{ch}")

# Save full transparent logo (logo.png & images/logo.png)
dests = [
    r"C:\Users\Admin\.gemini\antigravity\scratch\ai-tools-directory\public\logo.png",
    r"C:\Users\Admin\.gemini\antigravity\scratch\ai-tools-directory\public\images\logo.png"
]

for dest in dests:
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    cropped_logo.save(dest, "PNG")
    print(f"Saved full transparent logo (with A cutout) to {dest}")

# Generate favicon from icon-only region (squircle + sparkles)
# Left region of logo (x from 0 to ~330 in original cropped logo coordinate space)
# In cropped_logo, the icon width is approx ch * 1.45
icon_w = int(ch * 1.5)
icon_region = cropped_logo.crop((0, 0, min(cw, icon_w), ch))
icon_bbox = icon_region.getbbox()

if icon_bbox:
    icon_cropped = icon_region.crop(icon_bbox)
    iw, ih = icon_cropped.size
    
    canvas_size = 512
    square_fav = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    
    scale = min(440.0 / iw, 440.0 / ih)
    nw = int(iw * scale)
    nh = int(ih * scale)
    resized_icon = icon_cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    
    offset_x = (canvas_size - nw) // 2
    offset_y = (canvas_size - nh) // 2
    square_fav.paste(resized_icon, (offset_x, offset_y), resized_icon)
    
    fav_dest = r"C:\Users\Admin\.gemini\antigravity\scratch\ai-tools-directory\public\favicon.png"
    square_fav.save(fav_dest, "PNG")
    print(f"Saved icon-only favicon (with A cutout) to {fav_dest}")

print("Remove all white complete.")
