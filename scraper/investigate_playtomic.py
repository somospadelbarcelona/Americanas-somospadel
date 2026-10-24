# -*- coding: utf-8 -*-
import urllib.request
import re
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://app.playtomic.com/tournaments/46011a01-b51f-4ffb-876e-e7eb7e51c1ff'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
req = urllib.request.Request(url, headers=headers)
html = urllib.request.urlopen(req, timeout=10, context=ctx).read().decode('utf-8')

chunk_urls = re.findall(r'src="(/_next/static/chunks/[^"]+\.js)"', html)
print('Chunks found:', len(chunk_urls))

for c_url in chunk_urls:
    full_c_url = 'https://app.playtomic.com' + c_url
    try:
        req = urllib.request.Request(full_c_url, headers=headers)
        js = urllib.request.urlopen(req, timeout=10, context=ctx).read().decode('utf-8')
        
        # Look for API domain or endpoints
        domains = set(re.findall(r'https?://[a-zA-Z0-9\.\-]+playtomic\.[a-z]+[^\s"\'`,]*', js))
        if domains:
            print(f'Chunk {c_url}:')
            for d in list(domains)[:5]:
                print('   Domain/URL:', d)
                
        # Look for paths with tournament or players or teams
        keywords = ['tournament', 'participant', 'player', 'team', 'competitions']
        for kw in keywords:
            matches = set(re.findall(r'"(/[a-zA-Z0-9\-_/]*' + kw + r'[a-zA-Z0-9\-_/]*)"', js))
            if matches:
                print(f'   Matches for {kw}:', list(matches)[:5])
    except Exception as e:
        print(f'Err {c_url}: {e}')
