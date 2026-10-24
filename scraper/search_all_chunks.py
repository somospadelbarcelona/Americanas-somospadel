import urllib.request
import re

chunks = [
    'https://app.playtomic.com/_next/static/chunks/8126-d23fafc27e381116.js',
    'https://app.playtomic.com/_next/static/chunks/1363-f015cdcbcf7b04a3.js',
    'https://app.playtomic.com/_next/static/chunks/6434-5df207c0f1b32d5b.js',
    'https://app.playtomic.com/_next/static/chunks/5587-b90e8b12e857e6a6.js'
]

for url in chunks:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            text = resp.read().decode('utf-8', errors='ignore')
            auth_matches = set(re.findall(r'["\']([a-zA-Z0-9_\-\./:]*auth[a-zA-Z0-9_\-\./:]*)["\']', text))
            if auth_matches:
                print(url.split('/')[-1], auth_matches)
            # Search for password or login
            post_matches = set(re.findall(r'["\'](POST|GET)["\']', text))
            login_matches = set(re.findall(r'["\']([a-zA-Z0-9_\-\./:]*login[a-zA-Z0-9_\-\./:]*)["\']', text))
            if login_matches:
                print('Login matches in', url.split('/')[-1], login_matches)
    except Exception as e:
        print('Err:', e)
