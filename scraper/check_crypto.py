# -*- coding: utf-8 -*-
import os
import json
import base64
import sqlite3
import shutil

try:
    import win32crypt
    from Crypto.Cipher import AES
except Exception as e:
    print("Crypto / win32crypt not installed:", e)
    # Let's check with ctypes
    import ctypes
    from ctypes import wintypes
