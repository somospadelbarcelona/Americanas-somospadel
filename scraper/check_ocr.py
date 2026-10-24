# -*- coding: utf-8 -*-
import sys
import os

# Let's check if pytesseract or PIL is installed
try:
    from PIL import Image
    print("PIL installed!")
except Exception as e:
    print("PIL not installed:", e)

try:
    import pytesseract
    print("pytesseract installed!")
except Exception as e:
    print("pytesseract not installed:", e)
