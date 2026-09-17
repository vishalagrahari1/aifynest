import os

with open(r"src/App.tsx", "r", encoding="utf-8") as f:
    app_code = f.read()

routes = [
    "/",
    "/ai-tools",
    "/blog",
    "/blog/best-image-generation-tools",
    "/blog/best-ai-writing-tools-2026",
    "/about",
    "/contact",
    "/terms",
    "/privacy",
    "/refund-policy",
    "/advertise",
    "/submit-tool",
    "/claim",
    "/login",
    "/signup",
    "/collections",
    "/compare",
    "/trending",
    "/new",
    "/pricing"
]

print("=== COMPREHENSIVE PAGE & ROUTE AUDIT ===")
all_ok = True
for r in routes:
    target = f'path="{r}"'
    if target in app_code or (r.startswith('/blog/') and 'path="/blog/:slug"' in app_code):
        print(f"[OK] {r:35} -> Registered in App.tsx")
    else:
        print(f"[MISSING] {r:35} -> MISSING IN App.tsx!")
        all_ok = False

if all_ok:
    print("\nSUCCESS: All key website pages are 100% registered and active in App.tsx!")
