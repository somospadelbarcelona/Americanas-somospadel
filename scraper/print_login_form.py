# -*- coding: utf-8 -*-
with open('scraper/check_app_login.py') as f:
    pass

import urllib.request, ssl, re
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://app.playtomic.com/login'
headers = {'User-Agent': 'Mozilla/5.0'}
html = urllib.request.urlopen(urllib.request.Request(url, headers=headers), context=ctx).read().decode('utf-8')

forms = re.findall(r'<form[^>]*>(.*?)</form>', html, re.DOTALL)
for f in forms:
    print(f)
