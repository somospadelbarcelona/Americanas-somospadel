import os
import sqlite3
import shutil
from datetime import datetime, timezone, timedelta

base = r'C:\Users\acoscolin\AppData\Local\Google\Chrome\User Data\Profile 6\History'
temp_db = 'scraper/temp_hist.db'

# Copy file with shared read
import win32file, win32con
def copy_file(src, dst):
    h = win32file.CreateFile(src, win32con.GENERIC_READ, win32con.FILE_SHARE_READ | win32con.FILE_SHARE_WRITE, None, win32con.OPEN_EXISTING, 0, None)
    with open(dst, 'wb') as f:
        while True:
            _, chunk = win32file.ReadFile(h, 64*1024)
            if not chunk: break
            f.write(chunk)
    win32file.CloseHandle(h)

copy_file(base, temp_db)
conn = sqlite3.connect(temp_db)
cur = conn.cursor()
cur.execute("SELECT url, title, visit_count, last_visit_time FROM urls WHERE url LIKE '%playtomic%' ORDER BY last_visit_time DESC LIMIT 50")
rows = cur.fetchall()

print(f"Total Playtomic URLs: {len(rows)}")
for url, title, count, t in rows:
    # Chrome timestamp is microseconds since 1601-01-01
    dt = datetime(1601, 1, 1, tzinfo=timezone.utc) + timedelta(microseconds=t) if t else None
    print(f"[{dt}] {title} -> {url}")

conn.close()
if os.path.exists(temp_db): os.remove(temp_db)
