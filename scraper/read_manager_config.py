# -*- coding: utf-8 -*-
import urllib.request, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://manager.playtomic.io/config-dd816834.js'
headers = {'User-Agent': 'Mozilla/5.0'}

r = urllib.request.urlopen(urllib.request.Request(url, headers=headers), context=ctx)
print(r.read().decode('utf-8'))
