import re
import json

files = [
    r'C:\Users\acoscolin\AppData\Local\Google\Chrome\User Data\Profile 6\Local Storage\leveldb\009543.ldb',
    r'C:\Users\acoscolin\AppData\Local\Google\Chrome\User Data\Profile 6\Local Storage\leveldb\009544.ldb'
]

for fpath in files:
    print(f"\n================ Analysing {fpath} ================")
    with open(fpath, 'rb') as fp:
        raw = fp.read()
    
    # 1. Search for tournament id 46011a01
    matches_tid = [m.start() for m in re.finditer(b'46011a01', raw)]
    print(f"Tournament 46011a01 matches: {len(matches_tid)}")
    for idx in matches_tid:
        snippet = raw[max(0, idx-200):min(len(raw), idx+400)]
        print(f"Snippet at {idx}:")
        print(snippet.decode('utf-8', errors='ignore'))
        print("-" * 50)
        
    # 2. Search for JWT tokens (Bearer tokens)
    tokens = re.findall(rb'eyJ[a-zA-Z0-9_\-\.]{50,}', raw)
    print(f"Found {len(tokens)} JWT tokens")
    for tok in set(tokens):
        t_str = tok.decode('utf-8', errors='ignore')
        # Try decoding JWT payload to see what issuer / subject it has
        parts = t_str.split('.')
        if len(parts) >= 2:
            import base64
            try:
                padded = parts[1] + '=' * (-len(parts[1]) % 4)
                payload = json.loads(base64.urlsafe_b64decode(padded).decode('utf-8'))
                print("JWT Payload:", payload.get('iss'), payload.get('email'), payload.get('user_id'), payload.get('sub'))
                if 'playtomic' in str(payload).lower() or payload.get('email') == 'somospadeleugestion@gmail.com':
                    print(">>> RELEVANT PLAYTOMIC TOKEN FOUND! <<<")
                    print("Full Token:", t_str)
                    with open('scraper/extracted_token.txt', 'w') as out:
                        out.write(t_str)
            except Exception:
                pass
