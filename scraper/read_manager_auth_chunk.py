# -*- coding: utf-8 -*-
import urllib.request, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://manager.playtomic.io/assets/auth-BAwX8b-G.js'
headers = {'User-Agent': 'Mozilla/5.0'}
js = urllib.request.urlopen(urllib.request.Request(url, headers=headers), context=ctx).read().decode('utf-8')
print("Auth chunk length:", len(js))

# Look for login URLs or methods
import re
print("Matches:")
for m in re.finditer(r'https?://[a-zA-Z0-9\.\-_/]+', js):
    u = m.group(0)
    if 'playtomic' in u or 'google' in u or 'auth' in u:
        print("  ", u)
