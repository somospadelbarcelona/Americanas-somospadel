import os
import time
import json
import re
import win32file, win32con

cache_dir = r'C:\Users\acoscolin\AppData\Local\Google\Chrome\User Data\Profile 6\Cache\Cache_Data'
now = time.time()

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

targets = [b'f58f8078', b'46011a01', b'f25003a4', b'bd2ea8dd', b'halloween', b'schedule']

for f in os.listdir(cache_dir):
    full = os.path.join(cache_dir, f)
    if os.path.isfile(full):
        if now - os.path.getmtime(full) < 3600 * 6:
            data = read_locked(full)
            for t in targets:
                if t in data.lower():
                    print(f"\nTarget {t.decode()} matched in {f}!")
                    # Check if it has json or names
                    try:
                        text = data.decode('utf-8', errors='ignore')
                        # Find any URLs
                        urls = re.findall(r'https?://[^\s"\'<>]+', text)
                        if urls:
                            print("  URLs in cache:", urls[:3])
                        # Look for JSON arrays or objects
                        json_matches = re.findall(r'\{[^{}]*(?:name|player|team|user|title)[^{}]*\}', text)
                        if json_matches:
                            print(f"  Found {len(json_matches)} json-like objects:")
                            for jm in json_matches[:5]:
                                print("    ", jm[:150])
                    except Exception as e:
                        pass
