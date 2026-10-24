import urllib.request
import re

req = urllib.request.Request('https://app.playtomic.com/login', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

scripts = re.findall(r'src="([^"]+\.js)"', html)
print('Login scripts:', len(scripts))
for s in scripts:
    print(s)
