# -*- coding: utf-8 -*-
import urllib.request, ssl, re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://app.playtomic.com/tournaments/46011a01-68b4-433f-b2e3-581ca5fabfdb'
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
html = urllib.request.urlopen(urllib.request.Request(url, headers=headers), context=ctx).read().decode('utf-8')

pattern = r'"([a-zA-Z0-9_-]*(?:tenant|club|venue|resource|organization|merchant)[a-zA-Z0-9_-]*)":\s*"([^"]+)"'
for m in re.finditer(pattern, html, re.I):
    print(m.group(1), '-->', m.group(2))
