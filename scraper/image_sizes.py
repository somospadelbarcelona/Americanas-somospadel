# -*- coding: utf-8 -*-
from PIL import Image
import os, glob

uploaded_dir = r"C:\Users\acoscolin\.gemini\antigravity\brain\4e03ea48-6d25-4b4f-81dc-c105e0e25ca2\.user_uploaded"
files = sorted(glob.glob(os.path.join(uploaded_dir, "*.*")))

for f in files:
    im = Image.open(f)
    print(f"{os.path.basename(f)}: size={im.size}, mode={im.mode}")
