# -*- coding: utf-8 -*-
import re

# 1. Update admin.html
with open('admin.html', 'r', encoding='utf-8') as f:
    admin_html = f.read()

admin_html = admin_html.replace('somospadelbarcelona@gmail.com', 'somospadeleugestion@gmail.com')
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(admin_html)
print("Updated admin.html account to somospadeleugestion@gmail.com")

# 2. Update admin-americanas.js
with open('js/modules/admin-americanas.js', 'r', encoding='utf-8') as f:
    js_code = f.read()

js_code = js_code.replace('somospadelbarcelona@gmail.com', 'somospadeleugestion@gmail.com')
with open('js/modules/admin-americanas.js', 'w', encoding='utf-8') as f:
    f.write(js_code)
print("Updated admin-americanas.js account to somospadeleugestion@gmail.com")

# 3. Update playtomic_api_sync.py
with open('scraper/playtomic_api_sync.py', 'r', encoding='utf-8') as f:
    py_code = f.read()

py_code = py_code.replace('somospadelbarcelona@gmail.com', 'somospadeleugestion@gmail.com')
if 'TENANT_ID =' not in py_code:
    py_code = py_code.replace(
        'API_BASE = "https://api.app.playtomic.io"',
        'API_BASE = "https://api.app.playtomic.io"\nTENANT_NEW_PLAY = "bd2ea8dd-4c1d-4e64-98eb-3ff2ab9b2051"'
    )

with open('scraper/playtomic_api_sync.py', 'w', encoding='utf-8') as f:
    f.write(py_code)
print("Updated playtomic_api_sync.py to somospadeleugestion@gmail.com with tenant")

# 4. Save credentials file template
import json
with open('scraper/playtomic_credentials.json', 'w', encoding='utf-8') as f:
    json.dump({"email": "somospadeleugestion@gmail.com", "tenant_id": "bd2ea8dd-4c1d-4e64-98eb-3ff2ab9b2051"}, f, indent=2)
print("Saved scraper/playtomic_credentials.json")
