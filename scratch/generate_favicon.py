import os
from PIL import Image

logo_path = r"C:\Users\Admin\.gemini\antigravity\scratch\ai-tools-directory\public\logo.png"
fav_path = r"C:\Users\Admin\.gemini\antigravity\scratch\ai-tools-directory\public\favicon.png"

img = Image.open(logo_path).convert("RGBA")
w, h = img.size

# The icon (squircle + sparkles) is located on the left side (x from 0 to ~330)
icon_region = img.crop((0, 0, 330, h))
bbox = icon_region.getbbox()

if bbox:
    # Tight crop of the icon + sparkles
    icon_cropped = icon_region.crop(bbox)
    iw, ih = icon_cropped.size
    print(f"Extracted icon dimensions: {iw}x{ih}")

    # Create a square transparent canvas (e.g. 512x512) for high-resolution favicon
    canvas_size = 512
    square_fav = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    
    # Scale icon while keeping aspect ratio to fit in 440x440 active area inside 512x512
    scale = min(440.0 / iw, 440.0 / ih)
    nw = int(iw * scale)
    nh = int(ih * scale)
    resized_icon = icon_cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    
    offset_x = (canvas_size - nw) // 2
    offset_y = (canvas_size - nh) // 2
    square_fav.paste(resized_icon, (offset_x, offset_y), resized_icon)
    
    square_fav.save(fav_path, "PNG")
    print(f"Successfully generated icon-only favicon: {fav_path} ({canvas_size}x{canvas_size})")

print("Favicon generation complete.")
