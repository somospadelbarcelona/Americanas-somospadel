import os
import json
import base64
import sqlite3
import win32crypt
from Crypto.Cipher import AES
import win32file, win32con

appdata = os.environ.get('LOCALAPPDATA', '')
chrome_user_data = os.path.join(appdata, r'Google\Chrome\User Data')
local_state_path = os.path.join(chrome_user_data, 'Local State')

with open(local_state_path, 'r', encoding='utf-8') as f:
    local_state = json.loads(f.read())

encrypted_key = base64.b64decode(local_state['os_crypt']['encrypted_key'])[5:]
key = win32crypt.CryptUnprotectData(encrypted_key, None, None, None, 0)[1]

def copy_file(src, dst):
    h = win32file.CreateFile(src, win32con.GENERIC_READ, win32con.FILE_SHARE_READ | win32con.FILE_SHARE_WRITE, None, win32con.OPEN_EXISTING, 0, None)
    with open(dst, 'wb') as f:
        while True:
            _, chunk = win32file.ReadFile(h, 64*1024)
            if not chunk: break
            f.write(chunk)
    win32file.CloseHandle(h)

temp_db = 'scraper/chrome_login_temp.db'

for p in os.listdir(chrome_user_data):
    login_path = os.path.join(chrome_user_data, p, 'Login Data')
    if os.path.exists(login_path):
        try:
            copy_file(login_path, temp_db)
            conn = sqlite3.connect(temp_db)
            cursor = conn.cursor()
            cursor.execute("SELECT origin_url, username_value, password_value FROM logins WHERE username_value LIKE '%somospadel%' OR username_value LIKE '%gestion%' OR origin_url LIKE '%playtomic%'")
            rows = cursor.fetchall()
            if rows:
                print(f"=== Found in {p} ===")
                for row in rows:
                    origin, username, encrypted_pw = row
                    password = ""
                    try:
                        iv = encrypted_pw[3:15]
                        payload = encrypted_pw[15:]
                        cipher = AES.new(key, AES.MODE_GCM, iv)
                        password = cipher.decrypt(payload)[:-16].decode('utf-8')
                    except Exception as e:
                        password = f"<err: {e}>"
                    print(f"  {p} | {origin} | {username} | {password}")
            conn.close()
        except Exception:
            pass

try: os.remove(temp_db)
except: pass
