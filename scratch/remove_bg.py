import os
from PIL import Image

src_path = r"C:\Users\Admin\.gemini\antigravity\brain\ba92285f-973c-472f-a845-324b033524a5\media__1789559962396.png"

img = Image.open(src_path).convert("RGBA")
width, height = img.size
print(f"Image size: {width}x{height}")

# Check corner pixel color
corners = [
    img.getpixel((0, 0)),
    img.getpixel((width - 1, 0)),
    img.getpixel((0, height - 1)),
    img.getpixel((width - 1, height - 1))
]
print("Corner pixels:", corners)

# Process image: convert white background to transparent while handling antialiased fringe gracefully.
# For pixels close to white (R,G,B close to 255), adjust alpha based on how close to white they are.
datas = img.getdata()
newData = []

# Floodfill from corners to identify background, or threshold with smooth alpha transition
# Let's inspect if background is uniform pure white (255, 255, 255) or off-white.
# A smooth formula for white background removal:
# Alpha = 255 - min_component_distance_to_white or distance formula
for item in datas:
    r, g, b, a = item
    # Calculate luminance / lightness or closeness to pure white (255, 255, 255)
    # If pixel is pure white (255, 255, 255) or near white:
    if r > 240 and g > 240 and b > 240:
        # Distance from white
        diff_r = 255 - r
        diff_g = 255 - g
        diff_b = 255 - b
        # Max difference from 255
        max_diff = max(diff_r, diff_g, diff_b)
        if max_diff < 5:
            # Pure white -> transparent
            newData.append((255, 255, 255, 0))
        else:
            # Transition edge: scale alpha smoothly and un-blend the white background color
            # Target alpha (0 to 255) based on how far from 255 it is
            new_a = int((max_diff / 15.0) * 255)
            new_a = min(255, max(0, new_a))
            # Restore foreground color assuming blend over white: C_fg = (C_src - (1-alpha)*255) / alpha
            alpha_f = new_a / 255.0
            if alpha_f > 0:
                unblend_r = int(min(255, max(0, (r - (1 - alpha_f) * 255) / alpha_f)))
                unblend_g = int(min(255, max(0, (g - (1 - alpha_f) * 255) / alpha_f)))
                unblend_b = int(min(255, max(0, (b - (1 - alpha_f) * 255) / alpha_f)))
                newData.append((unblend_r, unblend_g, unblend_b, new_a))
            else:
                newData.append((255, 255, 255, 0))
    else:
        newData.append(item)

img.putdata(newData)

# Save to destination paths
dests = [
    r"C:\Users\Admin\.gemini\antigravity\scratch\ai-tools-directory\public\logo.png",
    r"C:\Users\Admin\.gemini\antigravity\scratch\ai-tools-directory\public\images\logo.png",
    r"C:\Users\Admin\.gemini\antigravity\scratch\ai-tools-directory\public\favicon.png"
]

for dest in dests:
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    img.save(dest, "PNG")
    print(f"Saved logo to {dest}")

print("Done processing logo.")
