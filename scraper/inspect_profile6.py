import os
import re

profile_dir = r'C:\Users\acoscolin\AppData\Local\Google\Chrome\User Data\Profile 6'
targets = [
    os.path.join(profile_dir, 'Local Storage', 'leveldb'),
    os.path.join(profile_dir, 'IndexedDB'),
    os.path.join(profile_dir, 'Sessions')
]

for t in targets:
    if not os.path.exists(t):
        continue
    print(f"\n--- Checking {t} ---")
    for root, dirs, files in os.walk(t):
        for f in files:
            full = os.path.join(root, f)
            try:
                with open(full, 'rb') as fp:
                    data = fp.read()
                    if b'playtomic' in data.lower():
                        print(f"Match in: {full} (len {len(data)})")
                        # Look for auth token or user names or tournament id
                        if b'46011a01' in data:
                            print(f"   -> FOUND TOURNAMENT ID 46011a01 in {f}!")
                        # Search for idToken or accessToken
                        tokens = re.findall(rb'eyJ[a-zA-Z0-9_\-\.]{50,}', data)
                        if tokens:
                            print(f"   -> Found {len(tokens)} JWT tokens in {f}")
                            for tok in set(tokens):
                                tok_str = tok.decode('utf-8', errors='ignore')
                                # Print first 30 and last 10 chars
                                print(f"      Token: {tok_str[:35]}...{tok_str[-15:]}")
            except Exception as e:
                pass
