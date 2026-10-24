import os
import re

profiles = ['Profile 36', 'Profile 6']
base = r'C:\Users\acoscolin\AppData\Local\Google\Chrome\User Data'

for p in profiles:
    p_dir = os.path.join(base, p)
    print(f"\n=================== Checking {p} ===================")
    for root, dirs, files in os.walk(p_dir):
        for f in files:
            full = os.path.join(root, f)
            # Skip huge cache files
            if any(skip in full for skip in ['Cache', 'Media Cache', 'Code Cache']):
                continue
            try:
                with open(full, 'rb') as fp:
                    content = fp.read()
                    if b'playtomic' in content.lower():
                        print(f"FOUND 'playtomic' in: {full} (size: {len(content)})")
                        # Look for tokens or urls
                        urls = re.findall(rb'https?://[^\s"\'<>\\]+playtomic[^\s"\'<>\\]*', content)
                        if urls:
                            for u in set(urls[:5]):
                                print(f"   URL: {u.decode('utf-8', errors='ignore')}")
                        tokens = re.findall(rb'eyJ[a-zA-Z0-9_\-\.]{50,}', content)
                        if tokens:
                            print(f"   FOUND {len(tokens)} JWT TOKENS!")
                            for tok in tokens[:3]:
                                print(f"   JWT: {tok[:40].decode('utf-8', errors='ignore')}...")
            except Exception as e:
                pass
