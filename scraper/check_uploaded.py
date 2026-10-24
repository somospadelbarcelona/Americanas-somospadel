# -*- coding: utf-8 -*-
import os, glob

uploaded_dir = r"C:\Users\acoscolin\.gemini\antigravity\brain\4e03ea48-6d25-4b4f-81dc-c105e0e25ca2\.user_uploaded"
files = glob.glob(os.path.join(uploaded_dir, "*.*"))
print(f"Uploaded files ({len(files)}):")
for f in files:
    print(" ", f, "size:", os.path.getsize(f))
