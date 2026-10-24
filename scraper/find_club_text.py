# -*- coding: utf-8 -*-
import urllib.request, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://app.playtomic.com/tournaments/46011a01-68b4-433f-b2e3-581ca5fabfdb'
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
html = urllib.request.urlopen(urllib.request.Request(url, headers=headers), context=ctx).read().decode('utf-8')

for query in ['NEW Play', 'Hospitalet', 'Somospadel']:
    idx = html.find(query)
    while idx != -1:
        print(f"Query '{query}' at {idx}:")
        print(html[max(0, idx-100):min(len(html), idx+300)])
        print("="*60)
        idx = html.find(query, idx+1)
