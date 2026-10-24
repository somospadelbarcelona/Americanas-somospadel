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

with open(local_state_path, 'r', encoding='utf-8') as f:
    local_state = json.loads(f.read())

encrypted_key = base64.b64decode(local_state['os_crypt']['encrypted_key'])[5:]
key = win32crypt.CryptUnprotectData(encrypted_key, None, None, None, 0)[1]

for item in os.listdir(chrome_user_data):
    p_dir = os.path.join(chrome_user_data, item)
    if not os.path.isdir(p_dir): continue
    
    cookies_path = os.path.join(p_dir, r'Network\Cookies')
    if os.path.exists(cookies_path):
        temp_db = f'scraper/temp_{item}_cookies.db'
        try:
            shutil.copy2(cookies_path, temp_db)
            conn = sqlite3.connect(temp_db)
            c = conn.cursor()
            c.execute("SELECT host_key, name, encrypted_value FROM cookies WHERE host_key LIKE '%playtomic%'")
            rows = c.fetchall()
            if rows:
                print(f"🔥 FOUND {len(rows)} playtomic cookies in {item}!")
                for h, n, enc in rows:
                    try:
                        iv = enc[3:15]
                        payload = enc[15:]
                        cipher = AES.new(key, AES.MODE_GCM, iv)
                        val = cipher.decrypt(payload)[:-16].decode('utf-8')
                        print(f"   [{h}] {n} = {val[:40]}... (len={len(val)})")
                        with open(f'scraper/cookie_{item}_{n}.txt', 'w', encoding='utf-8') as cf:
                            cf.write(val)
                    except Exception as e:
                        print(f"   Err decrypting: {e}")
            conn.close()
        except Exception as e:
            pass
        finally:
            if os.path.exists(temp_db):
                try: os.remove(temp_db)
                except: pass

    # Also check Logins in this profile!
    login_path = os.path.join(p_dir, 'Login Data')
    if os.path.exists(login_path):
        temp_login = f'scraper/temp_{item}_login.db'
        try:
            shutil.copy2(login_path, temp_login)
            conn = sqlite3.connect(temp_login)
            c = conn.cursor()
            c.execute("SELECT origin_url, username_value, password_value FROM logins WHERE origin_url LIKE '%playtomic%'")
            rows = c.fetchall()
            if rows:
                print(f"🔑 FOUND {len(rows)} playtomic logins in {item}!")
                for u, user, enc_p in rows:
                    try:
                        iv = enc_p[3:15]
                        payload = enc_p[15:]
                        cipher = AES.new(key, AES.MODE_GCM, iv)
                        pw = cipher.decrypt(payload)[:-16].decode('utf-8')
                        print(f"   URL: {u} | User: {user} | Pw: {pw}")
                        with open('scraper/playtomic_found_login.json', 'w', encoding='utf-8') as out:
                            json.dump({"url": u, "username": user, "password": pw}, out, indent=2)
                    except Exception as e:
                        print(f"   Err decrypting pw: {e}")
            conn.close()
        except Exception as e:
            pass
        finally:
            if os.path.exists(temp_login):
                try: os.remove(temp_login)
                except: pass
