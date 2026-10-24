# -*- coding: utf-8 -*-
with open('scraper/manager_login.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re
scripts = re.findall(r'src="([^"]+\.js)"', html)
print("Scripts found in manager login:", len(scripts))
for s in scripts:
    print(" ", s)
