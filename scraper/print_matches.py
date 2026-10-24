import re

with open('scraper/next_stream_decoded.txt', 'r', encoding='utf-8') as f:
    text = f.read()

for kw in ['team', 'spot', 'user', 'regist']:
    print(f"\n=== MATCHES FOR {kw} ===")
    for m in re.finditer(re.escape(kw), text, re.IGNORECASE):
        start = max(0, m.start() - 100)
        end = min(len(text), m.end() + 100)
        print(text[start:end].replace('\n', ' '))
