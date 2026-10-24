import os
import json
import base64
import sqlite3
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import win32crypt
import win32file
import win32con

def copy_locked_file(src, dst):
    handle = win32file.CreateFile(
        src,
        win32con.GENERIC_READ,
        win32con.FILE_SHARE_READ | win32con.FILE_SHARE_WRITE | win32con.FILE_SHARE_DELETE,
        None,
        win32con.OPEN_EXISTING,
        win32con.FILE_ATTRIBUTE_NORMAL,
        None
    )
    with open(dst, 'wb') as f_out:
        while True:
            hr, data = win32file.ReadFile(handle, 64 * 1024)
            if not data:
                break
            f_out.write(data)
    win32file.CloseHandle(handle)

def get_encryption_key():
    local_state_path = r'C:\Users\acoscolin\AppData\Local\Google\Chrome\User Data\Local State'
    with open(local_state_path, 'r', encoding='utf-8') as f:
        local_state = json.load(f)
    encrypted_key = base64.b64decode(local_state['os_crypt']['encrypted_key'])
    encrypted_key = encrypted_key[5:]
    key = win32crypt.CryptUnprotectData(encrypted_key, None, None, None, 0)[1]
    return key

def decrypt_data(data, key):
    try:
        iv = data[3:15]
        payload = data[15:]
        cipher = AESGCM(key)
        decrypted_pass = cipher.decrypt(iv, payload, None)
        return decrypted_pass.decode('utf-8', errors='ignore')
    except Exception as e:
        return ""

def dump_playtomic_cookies():
    cookie_db = r'C:\Users\acoscolin\AppData\Local\Google\Chrome\User Data\Profile 6\Network\Cookies'
    temp_cookie = 'scraper/temp_cookies.db'
    if not os.path.exists(cookie_db):
        print("Cookie file not found:", cookie_db)
        return
        
    copy_locked_file(cookie_db, temp_cookie)
    key = get_encryption_key()
        
    conn = sqlite3.connect(temp_cookie)
    cur = conn.cursor()
    cur.execute("SELECT host_key, name, encrypted_value FROM cookies WHERE host_key LIKE '%playtomic%'")
    rows = cur.fetchall()
    print(f"Found {len(rows)} cookies for playtomic in Profile 6:")
    playtomic_cookies = {}
    for host, name, enc_val in rows:
        val = decrypt_data(enc_val, key)
        print(f"  {host} -> {name}: {val[:30]}...")
        playtomic_cookies[f"{host}:{name}"] = val
        
    with open('scraper/playtomic_cookies.json', 'w') as f:
        json.dump(playtomic_cookies, f, indent=2)
    conn.close()
    if os.path.exists(temp_cookie):
        os.remove(temp_cookie)

if __name__ == '__main__':
    try:
        dump_playtomic_cookies()
    except Exception as e:
        print("Error:", e)
