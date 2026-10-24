# -*- coding: utf-8 -*-
import os, glob, datetime

userprofile = os.environ.get('USERPROFILE', '')
search_dirs = [
    os.path.join(userprofile, 'Downloads'),
    os.path.join(userprofile, 'Desktop'),
    os.path.join(userprofile, 'Pictures'),
    os.path.join(userprofile, 'Pictures/Screenshots'),
    os.path.join(userprofile, r'OneDrive - GRUPO SIFU INTEGRACION LABORAL SL\Escritorio')
]

today = datetime.date(2026, 10, 24)
found_today = []

for d in search_dirs:
    if os.path.exists(d):
        for f in glob.glob(os.path.join(d, "*.*")):
            try:
                mtime = os.path.getmtime(f)
                fdate = datetime.date.fromtimestamp(mtime)
                if fdate == today:
                    found_today.append((mtime, f))
            except:
                pass

found_today.sort(reverse=True)
print(f"Found {len(found_today)} files created or modified today:")
for mtime, f in found_today[:20]:
    dt = datetime.datetime.fromtimestamp(mtime).strftime('%H:%M:%S')
    print(f"  [{dt}] {f}")
