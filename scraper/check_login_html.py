# -*- coding: utf-8 -*-
with open('scraper/manager_login.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re

# Look for form, inputs, auth provider buttons
print("Forms or login buttons:")
for m in re.finditer(r'<(button|input|form|a)[^>]*>', html):
    tag = m.group(0)
    if any(k in tag.lower() for k in ['login', 'auth', 'submit', 'google', 'email', 'pass']):
        print(" ", tag)
