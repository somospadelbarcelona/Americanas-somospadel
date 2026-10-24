import urllib.request
import re

url = 'https://app.playtomic.com/_next/static/chunks/app/login/page-4e0b335151d04296.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    code = resp.read().decode('utf-8', errors='ignore')

print('Length:', len(code))
# Let's search for URLs or strings containing 'auth'
matches = set(re.findall(r'https?://[^\s"\'`]+', code))
print('URLs:', matches)

endpoints = set(re.findall(r'["\'](/v[123]/[a-zA-Z0-9_\-/]+)["\']', code))
print('Endpoints:', endpoints)

# Find form actions or fetch calls
fetch_calls = set(re.findall(r'["\']([a-zA-Z0-9_\-\./]+auth[a-zA-Z0-9_\-\./]*)["\']', code))
print('Auth strings:', fetch_calls)
