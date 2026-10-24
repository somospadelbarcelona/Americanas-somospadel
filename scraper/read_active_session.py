import os
import re
import win32file, win32con

sess_dir = r'C:\Users\acoscolin\AppData\Local\Google\Chrome\User Data\Profile 6\Sessions'
files = [
    'Session_13437316225734194',
    'Tabs_13437300174803617',
    'Session_13437316212846924',
    'Tabs_13437265708838569'
]

def read_locked(full):
    try:
        h = win32file.CreateFile(full, win32con.GENERIC_READ, win32con.FILE_SHARE_READ | win32con.FILE_SHARE_WRITE | win32con.FILE_SHARE_DELETE, None, win32con.OPEN_EXISTING, 0, None)
        chunks = []
        while True:
            _, chunk = win32file.ReadFile(h, 64*1024)
            if not chunk: break
            chunks.append(chunk)
        win32file.CloseHandle(h)
        return b''.join(chunks)
    except Exception as e:
        print(f"Error reading {full}: {e}")
        return b''

for f in files:
    full = os.path.join(sess_dir, f)
    if os.path.exists(full):
        data = read_locked(full)
        print(f"\n--- Read {f} (size {len(data)}) ---")
        # Find playtomic URLs
        urls = re.findall(rb'https?://[^\x00-\x1f\x7f-\xff]+', data)
        for u in set(urls):
            if b'playtomic' in u:
                print('  URL:', u.decode('utf-8', errors='ignore'))
        # Search for player names or tokens or tid
        if b'bd2ea8dd' in data:
            print(f"  FOUND TENANT ID bd2ea8dd in {f}!")
        if b'46011a01' in data:
            print(f"  FOUND TOURNAMENT ID 46011a01 in {f}!")
        # Search for JWT tokens
        tokens = re.findall(rb'eyJ[a-zA-Z0-9_\-\.]{50,}', data)
        if tokens:
            print(f"  FOUND {len(tokens)} JWT tokens in {f}!")
            for tok in set(tokens):
                print(f"    Token: {tok[:40].decode('utf-8', errors='ignore')}...")
