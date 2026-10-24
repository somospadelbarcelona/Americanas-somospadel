# -*- coding: utf-8 -*-
import os
import json
import base64
import sqlite3
import shutil
import win32crypt
from Crypto.Cipher import AES

appdata = os.environ.get('LOCALAPPDATA', '')
chrome_user_data = os.path.join(appdata, r'Google\Chrome\User Data')
local_state_path = os.path.join(chrome_user_data, 'Local State')
cookies_path = os.path.join(chrome_user_data, r'Default\Network\Cookies')

if not os.path.exists(cookies_path):
    print("Cookies path not found:", cookies_path)
    exit(0)

with open(local_state_path, 'r', encoding='utf-8') as f:
    local_state = json.loads(f.read())

encrypted_key = base64.b64decode(local_state['os_crypt']['encrypted_key'])[5:]
key = win32crypt.CryptUnprotectData(encrypted_key, None, None, None, 0)[1]

temp_db = 'scraper/chrome_cookies_temp.db'
shutil.copy2(cookies_path, temp_db)

conn = sqlite3.connect(temp_db)
cursor = conn.cursor()
cursor.execute("SELECT host_key, name, encrypted_value FROM cookies WHERE host_key LIKE '%playtomic%'")

rows = cursor.fetchall()
print(f"Found {len(rows)} playtomic cookies in Chrome:")

cookies_dict = {}

for host_key, name, encrypted_val in rows:
    try:
        iv = encrypted_val[3:15]
        payload = encrypted_val[15:]
        cipher = AES.new(key, AES.MODE_GCM, iv)
        val = cipher.decrypt(payload)[:-16].decode('utf-8')
        print(f"  [{host_key}] {name} = {val[:25]}... (len={len(val)})")
        cookies_dict[name] = val
    except Exception as e:
        print(f"  [{host_key}] {name} (err: {e})")

conn.close()
try: os.remove(temp_db)
except: pass

if cookies_dict:
    with open('scraper/chrome_playtomic_cookies.json', 'w', encoding='utf-8') as out:
        json.dump(cookies_dict, out, indent=2)
    print("Saved cookies to scraper/chrome_playtomic_cookies.json!")
