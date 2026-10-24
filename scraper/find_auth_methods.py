# -*- coding: utf-8 -*-
import urllib.request, ssl, re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://manager.playtomic.io/assets/index-BFvobo1d.js'
headers = {'User-Agent': 'Mozilla/5.0'}
js = urllib.request.urlopen(urllib.request.Request(url, headers=headers), context=ctx).read().decode('utf-8')

for kw in ['signIn', 'auth', 'login', 'google', 'password']:
    matches = [m.start() for m in re.finditer(kw, js, re.I)]
    print(f"Keyword '{kw}': {len(matches)} matches")
    for idx in matches[:3]:
        print("  ", js[max(0, idx-50):min(len(js), idx+100)])
