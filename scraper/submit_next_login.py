# -*- coding: utf-8 -*-
import urllib.request, urllib.parse, ssl, http.cookiejar, re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), urllib.request.HTTPSHandler(context=ctx))

login_page_url = 'https://app.playtomic.com/login'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': login_page_url
}

req1 = urllib.request.Request(login_page_url, headers=headers)
html = opener.open(req1).read().decode('utf-8')

# Extract hidden fields
fields = {}
for m in re.finditer(r'<input\s+type="hidden"\s+name="([^"]+)"\s+value="([^"]*)"', html):
    fields[m.group(1)] = m.group(2).replace('&quot;', '"')

fields['email'] = 'somospadeleugestion@gmail.com'
fields['password'] = 'Factor2000!'

print("Submitting fields:", list(fields.keys()))

post_data = urllib.parse.urlencode(fields).encode('utf-8')
post_headers = {
    **headers,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Origin': 'https://app.playtomic.com'
}

req2 = urllib.request.Request(login_page_url, data=post_data, headers=post_headers, method='POST')
try:
    resp = opener.open(req2, timeout=10)
    print("Post Response Code:", resp.status)
    print("Final URL:", resp.geturl())
    content = resp.read().decode('utf-8')
    print("Content preview:", content[:300])
    print("Cookies received:")
    for c in cj:
        print(f"  {c.name} = {c.value[:30]}...")
except urllib.error.HTTPError as e:
    print(f"HTTPError {e.code}:", e.read().decode('utf-8')[:300])
except Exception as e:
    print("Err:", e)
