import urllib.request
import re
import json

url = 'https://app.playtomic.com/tournaments/46011a01-68b4-433f-b2e3-581ca5fabfdb'
req = urllib.request.Request(
    url,
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    }
)

try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        print(f"Tournament page fetched! Length: {len(html)}")
        
        with open('scraper/tournament_raw_page.html', 'w', encoding='utf-8') as f:
            f.write(html)
            
        # Search for any player or participant data in Next.js payloads
        # In Next.js App Router, payload chunks are in self.__next_f.push([1,"..."])
        pushes = re.findall(r'self\.__next_f\.push\(\[1,\s*\"(.*?)\"\]\)', html, re.DOTALL)
        print(f"Found {len(pushes)} Next.js push chunks")
        
        # Combine decoded chunks
        combined = ""
        for p in pushes:
            # Unescape string
            try:
                dec = p.encode('utf-8').decode('unicode_escape')
                combined += dec
            except Exception:
                combined += p
                
        print(f"Decoded combined stream length: {len(combined)}")
        with open('scraper/next_stream_decoded.txt', 'w', encoding='utf-8') as f:
            f.write(combined)
            
        # Search for keywords
        for kw in ['team', 'player', 'participant', 'regist', 'user', 'name', 'spot', '18 of 20', 'occupied']:
            matches = [m.start() for m in re.finditer(kw, combined, re.IGNORECASE)]
            print(f"Keyword '{kw}': {len(matches)} occurrences")
            
except Exception as e:
    print("Error:", e)
