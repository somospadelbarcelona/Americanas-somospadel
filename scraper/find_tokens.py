# -*- coding: utf-8 -*-
import os
import glob
import re

appdata = os.environ.get('LOCALAPPDATA', '')
paths = [
    os.path.join(appdata, r'Google\Chrome\User Data\Default\Local Storage\leveldb'),
    os.path.join(appdata, r'Microsoft\Edge\User Data\Default\Local Storage\leveldb')
]

found_tokens = []

for p in paths:
    if os.path.exists(p):
        print("Checking path:", p)
        for f in glob.glob(os.path.join(p, "*.ldb")) + glob.glob(os.path.join(p, "*.log")):
            try:
                with open(f, 'rb') as fp:
                    content = fp.read()
                    if b'playtomic' in content.lower():
                        print(f"Found 'playtomic' in {os.path.basename(f)} (size {len(content)})")
                        # Search for JWT tokens: eyJ...
                        jwts = re.findall(rb'eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}', content)
                        if jwts:
                            print("Found JWT tokens:", len(jwts))
                            for j in set(jwts):
                                found_tokens.append(j.decode('ascii', errors='ignore'))
            except Exception as e:
                pass

if found_tokens:
    print("Found total tokens:", len(found_tokens))
    with open('scraper/found_tokens.txt', 'w') as out:
        for t in set(found_tokens):
            out.write(t + "\n")
else:
    print("No playtomic tokens found in browser storage.")
