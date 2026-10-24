import os
import re

profile_dir = r'C:\Users\acoscolin\AppData\Local\Google\Chrome\User Data\Profile 6'

print(f"Scanning Profile 6 for tournament references...")

found_files = []
for root, dirs, files in os.walk(profile_dir):
    # skip caches to be fast
    if any(k in root for k in ['Cache', 'Media Cache', 'GPUCache', 'Code Cache']):
        continue
    for f in files:
        full = os.path.join(root, f)
        try:
            with open(full, 'rb') as fp:
                data = fp.read()
                # Check for tournament id
                if b'46011a01' in data or b'HALLOWEEN' in data or b'halloween' in data:
                    print(f"MATCH in {full} (size {len(data)})")
                    found_files.append((full, data))
        except Exception:
            pass

print(f"Total matched files: {len(found_files)}")
for path, data in found_files:
    if 'AMERICANAS' in path: continue
    print(f"\n--- Extracted from {path} ---")
    for m in re.finditer(rb'46011a01[^\s"\'\\<>]+', data):
        print("  Found TID:", m.group(0).decode('utf-8', errors='ignore'))
    # Look for adjacent player names or json
    for m in re.finditer(rb'(?:team|player|participant|name|user)[^\n\r]{1,100}', data, re.IGNORECASE):
        line = m.group(0).decode('utf-8', errors='ignore')
        if any(w in line.lower() for w in ['somos', 'padel', 'playtomic', 'halloween', 'carlos', 'david', 'sergio', 'marc', 'laura', 'marta']):
            print("  Snippet:", line[:120])
