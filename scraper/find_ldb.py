import os
import shutil

base = r'C:\Users\acoscolin\AppData\Local\Google\Chrome\User Data'
found = []

for p in os.listdir(base):
    ldb = os.path.join(base, p, 'Local Storage', 'leveldb')
    if os.path.exists(ldb):
        for f in os.listdir(ldb):
            if f.endswith('.ldb') or f.endswith('.log'):
                full = os.path.join(ldb, f)
                try:
                    with open(full, 'rb') as fp:
                        c = fp.read()
                        if b'playtomic' in c.lower():
                            print(f"FOUND IN {p} file {f} (size {len(c)})")
                            found.append((p, full))
                            # search for tokens or names
                            if b'tid=bd2ea8dd' in c:
                                print(f"   -> Found tenant tid in {p} {f}!")
                except Exception:
                    pass

print(f"Total files with playtomic: {len(found)}")
