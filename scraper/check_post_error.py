# -*- coding: utf-8 -*-
with open('scraper/submit_next_login.py') as f:
    pass

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
html = opener.open(urllib.request.Request(login_page_url, headers=headers)).read().decode('utf-8')
fields = {}
for m in re.finditer(r'<input\s+type="hidden"\s+name="([^"]+)"\s+value="([^"]*)"', html):
    fields[m.group(1)] = m.group(2).replace('&quot;', '"')
fields['email'] = 'somospadeleugestion@gmail.com'
fields['password'] = 'Factor2000!'

req2 = urllib.request.Request(login_page_url, data=urllib.parse.urlencode(fields).encode('utf-8'), headers={**headers, 'Content-Type': 'application/x-www-form-urlencoded', 'Origin': 'https://app.playtomic.com'}, method='POST')
resp = opener.open(req2, timeout=10)
content = resp.read().decode('utf-8')

# Search for any error or message
for m in re.finditer(r'(error|invalid|incorrect|failed|password|email)', content, re.I):
    idx = m.start()
    print("Match:", content[max(0, idx-40):min(len(content), idx+80)])
