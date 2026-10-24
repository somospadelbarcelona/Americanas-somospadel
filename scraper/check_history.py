import os
import sqlite3
import shutil

base = r'C:\Users\acoscolin\AppData\Local\Google\Chrome\User Data'
temp_db = 'scraper/temp_history.db'

for p in os.listdir(base):
    h_file = os.path.join(base, p, 'History')
    if os.path.exists(h_file):
        try:
            shutil.copy2(h_file, temp_db)
            conn = sqlite3.connect(temp_db)
            cur = conn.cursor()
            cur.execute("SELECT url, title, visit_count, last_visit_time FROM urls WHERE url LIKE '%playtomic%' ORDER BY last_visit_time DESC LIMIT 10")
            rows = cur.fetchall()
            if rows:
                print(f"=== History in {p} ===")
                for r in rows:
                    print(f"  {r[0]} | {r[1]}")
            conn.close()
        except Exception as e:
            pass

if os.path.exists(temp_db):
    os.remove(temp_db)
