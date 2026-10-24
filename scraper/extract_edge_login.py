# -*- coding: utf-8 -*-
import os, json, base64, sqlite3, shutil, win32crypt
from Crypto.Cipher import AES

appdata = os.environ.get('LOCALAPPDATA', '')
edge_user_data = os.path.join(appdata, r'Microsoft\Edge\User Data')
local_state_path = os.path.join(edge_user_data, 'Local State')
login_data_path = os.path.join(edge_user_data, r'Default\Login Data')

if os.path.exists(login_data_path):
    with open(local_state_path, 'r', encoding='utf-8') as f:
        local_state = json.loads(f.read())
    encrypted_key = base64.b64decode(local_state['os_crypt']['encrypted_key'])[5:]
    key = win32crypt.CryptUnprotectData(encrypted_key, None, None, None, 0)[1]

    temp_db = 'scraper/edge_login_temp.db'
    shutil.copy2(login_data_path, temp_db)
    conn = sqlite3.connect(temp_db)
    cursor = conn.cursor()
    cursor.execute("SELECT origin_url, action_url, username_value, password_value FROM logins WHERE origin_url LIKE '%playtomic%'")
    rows = cursor.fetchall()
    print(f"Found {len(rows)} playtomic entries in Edge Login Data:")
    for row in rows:
        origin, action, username, encrypted_pw = row
        try:
            iv = encrypted_pw[3:15]
            payload = encrypted_pw[15:]
            cipher = AES.new(key, AES.MODE_GCM, iv)
            password = cipher.decrypt(payload)[:-16].decode('utf-8')
            print(f"  User: {username} | Pass length: {len(password)}")
            with open('scraper/playtomic_credentials.json', 'w', encoding='utf-8') as out:
                json.dump({"email": username, "password": password}, out, indent=2)
            print("  ✅ Saved credentials to scraper/playtomic_credentials.json!")
        except Exception as e:
            print(f"  Err: {e}")
    conn.close()
    try: os.remove(temp_db)
    except: pass
else:
    print("Edge Login Data not found.")
