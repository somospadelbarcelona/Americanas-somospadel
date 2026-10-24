# -*- coding: utf-8 -*-
import urllib.request, ssl, re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://app.playtomic.com/login'
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

try:
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=10, context=ctx) as r:
        print('Status:', r.status)
        print('Final URL:', r.geturl())
        html = r.read().decode('utf-8')
        print('Length:', len(html))
        # Look for login form or actions
        forms = re.findall(r'<form[^>]*>(.*?)</form>', html, re.DOTALL)
        print('Forms:', len(forms))
        for f in forms:
            print("  Form:", f[:200])
except Exception as e:
    print('Err:', e)
