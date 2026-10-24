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
login_data_path = os.path.join(chrome_user_data, r'Default\Login Data')

if not os.path.exists(login_data_path):
    print("Login Data not found at:", login_data_path)
    exit(0)

# Get encryption key
with open(local_state_path, 'r', encoding='utf-8') as f:
    local_state = json.loads(f.read())

encrypted_key = base64.b64decode(local_state['os_crypt']['encrypted_key'])
encrypted_key = encrypted_key[5:] # Remove 'DPAPI' prefix
key = win32crypt.CryptUnprotectData(encrypted_key, None, None, None, 0)[1]

# Copy database to avoid lock
temp_db = 'scraper/chrome_login_temp.db'
shutil.copy2(login_data_path, temp_db)

conn = sqlite3.connect(temp_db)
cursor = conn.cursor()
cursor.execute("SELECT origin_url, action_url, username_value, password_value FROM logins WHERE origin_url LIKE '%playtomic%'")

rows = cursor.fetchall()
print(f"Found {len(rows)} playtomic entries in Chrome Login Data:")

for row in rows:
    origin, action, username, encrypted_pw = row
    password = ""
    try:
        iv = encrypted_pw[3:15]
        payload = encrypted_pw[15:]
        cipher = AES.new(key, AES.MODE_GCM, iv)
        decrypted = cipher.decrypt(payload)[:-16].decode('utf-8')
        password = decrypted
    except Exception as e:
        password = f"<err: {e}>"
    print(f"  URL: {origin} | User: {username} | Pass length: {len(password)}")
    if password and not password.startswith("<err:"):
        with open('scraper/playtomic_credentials.json', 'w', encoding='utf-8') as out:
            json.dump({"email": username, "password": password}, out, indent=2)
        print("  ✅ Saved credentials to scraper/playtomic_credentials.json!")

conn.close()
try: os.remove(temp_db)
except: pass
