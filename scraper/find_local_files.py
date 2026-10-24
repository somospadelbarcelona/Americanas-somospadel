# -*- coding: utf-8 -*-
import os, glob

userprofile = os.environ.get('USERPROFILE', '')
search_dirs = [
    os.path.join(userprofile, 'Downloads'),
    os.path.join(userprofile, 'Desktop'),
    os.path.join(userprofile, 'Pictures'),
    os.path.join(userprofile, 'Pictures/Screenshots'),
    os.path.join(userprofile, r'OneDrive - GRUPO SIFU INTEGRACION LABORAL SL\Escritorio')
]

found_files = []
for d in search_dirs:
    if os.path.exists(d):
        for ext in ['*.png', '*.jpg', '*.jpeg', '*.csv', '*.xlsx', '*.txt', '*.pdf']:
            for f in glob.glob(os.path.join(d, ext)):
                fname = os.path.basename(f).lower()
                if any(k in fname for k in ['playtomic', 'americana', 'halloween', 'torneo', 'jugador', 'inscrit', 'captura', 'screenshot', 'new play', 'hospitalet']):
                    mtime = os.path.getmtime(f)
                    found_files.append((mtime, f))

found_files.sort(reverse=True)
print(f"Found {len(found_files)} matching files in Downloads/Desktop/Pictures:")
for mtime, f in found_files[:15]:
    import datetime
    dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
    print(f"  [{dt}] {f}")
