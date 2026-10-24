# -*- coding: utf-8 -*-
import win32gui

def enum_windows_callback(hwnd, extra):
    if win32gui.IsWindowVisible(hwnd):
        title = win32gui.GetWindowText(hwnd)
        if title:
            extra.append((hwnd, title))

titles = []
win32gui.EnumWindows(enum_windows_callback, titles)

print(f"Total visible windows: {len(titles)}")
for hwnd, title in titles:
    if any(k in title.lower() for k in ['playtomic', 'padel', 'somospadel', 'admin', 'chrome', 'edge', 'whatsapp', 'halloween']):
        print(f"  [HWND {hwnd}] {title}")
