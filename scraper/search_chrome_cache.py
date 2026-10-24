import os
import re

cache_dir = r'C:\Users\acoscolin\AppData\Local\Google\Chrome\User Data\Profile 6\Cache\Cache_Data'
targets = [b'f58f8078', b'46011a01', b'f25003a4', b'bd2ea8dd']

print(f"Searching Chrome Cache in {cache_dir}...")

import win32file, win32con
def read_locked(fpath):
    try:
        h = win32file.CreateFile(fpath, win32con.GENERIC_READ, win32con.FILE_SHARE_READ | win32con.FILE_SHARE_WRITE, None, win32con.OPEN_EXISTING, 0, None)
        chunks = []
        while True:
            _, chunk = win32file.ReadFile(h, 64*1024)
            if not chunk: break
            chunks.append(chunk)
        win32file.CloseHandle(h)
        return b''.join(chunks)
    except Exception:
        return b''

matches_found = []
for f in os.listdir(cache_dir):
    full = os.path.join(cache_dir, f)
    if os.path.isfile(full):
        data = read_locked(full)
        for t in targets:
            if t in data:
                print(f"Target {t.decode()} matched in {f} (len {len(data)})")
                matches_found.append((f, t, data))

print(f"Total cache matches: {len(matches_found)}")
for fname, target, data in matches_found:
    print(f"\n--- Snippet from {fname} for {target.decode()} ---")
    pos = 0
    while True:
        idx = data.find(target, pos)
        if idx == -1: break
        snippet = data[max(0, idx-200):min(len(data), idx+500)]
        print(snippet.decode('utf-8', errors='ignore'))
        print("="*60)
        pos = idx + len(target) + 200
        if pos > idx + 2000: break
