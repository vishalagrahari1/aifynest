import re

seed_path = r"src/utils/seedData.ts"
with open(seed_path, "r", encoding="utf-8") as f:
    text = f.read()

# Extract websiteUrl entries
website_urls = re.findall(r'"websiteUrl":\s*"([^"]+)"', text)
affiliate_urls = re.findall(r'"affiliateUrl":\s*"([^"]+)"', text)

print("=== SEED DATA URL AUDIT ===")
print(f"Total websiteUrl entries found in seedData.ts: {len(website_urls)}")
print(f"Total affiliateUrl entries found in seedData.ts: {len(affiliate_urls)}")

invalid_web = [u for u in website_urls if not (u.startswith('http://') or u.startswith('https://'))]
invalid_aff = [u for u in affiliate_urls if not (u.startswith('http://') or u.startswith('https://'))]

print(f"Website URLs missing http/https: {len(invalid_web)}")
print(f"Affiliate URLs missing http/https: {len(invalid_aff)}")

if invalid_web:
    print("Invalid website URLs:", invalid_web[:5])
if invalid_aff:
    print("Invalid affiliate URLs:", invalid_aff[:5])

print("Audit completed successfully!")
