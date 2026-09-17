import os
import re
from supabase import createClient

env_vars = {}
if os.path.exists('.env'):
    with open('.env', 'r') as f:
        for line in f:
            if '=' in line:
                k, v = line.strip().split('=', 1)
                env_vars[k.strip()] = v.strip().strip("'").strip('"')

url = env_vars.get('VITE_SUPABASE_URL', 'https://izjpavrrcbglrdvrqeng.supabase.co')
key = env_vars.get('SUPABASE_SERVICE_ROLE_KEY') or env_vars.get('VITE_SUPABASE_ANON_KEY')

supabase = createClient(url, key)
res = supabase.from_('tools').select('id, name, slug, status').order('name').execute()

tools = res.data or []
print(f"Total tools in DB: {len(tools)}")

suffixed = [t for t in tools if re.search(r'-[0-9]+$', t['slug'])]
print(f"Tools with numeric suffix slugs (e.g. -2, -3): {len(suffixed)}")

for t in suffixed:
    print(f"  - Name: '{t['name']}' | Slug: '{t['slug']}' | Status: {t['status']}")
