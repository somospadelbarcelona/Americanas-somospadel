# -*- coding: utf-8 -*-
from PIL import Image
import pytesseract
import glob
import os

uploaded_dir = r"C:\Users\acoscolin\.gemini\antigravity\brain\4e03ea48-6d25-4b4f-81dc-c105e0e25ca2\.user_uploaded"
files = sorted(glob.glob(os.path.join(uploaded_dir, "*.*")))

for f in files:
    print("="*60)
    print("File:", os.path.basename(f))
    try:
        img = Image.open(f)
        text = pytesseract.image_to_string(img, lang='spa+eng')
        print("OCR Text:")
        print(text.strip())
    except Exception as e:
        print("OCR err:", e)
