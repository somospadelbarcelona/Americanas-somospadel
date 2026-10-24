# -*- coding: utf-8 -*-
import os, glob

userprofile = os.environ.get('USERPROFILE', '')
appdata = os.environ.get('LOCALAPPDATA', '')
appdata_roaming = os.environ.get('APPDATA', '')

# Check Outlook, Thunderbird, Mail
mail_paths = [
    os.path.join(appdata, r'Microsoft\Outlook'),
    os.path.join(appdata_roaming, r'Thunderbird\Profiles'),
    os.path.join(appdata, r'Packages\microsoft.windowscommunicationsapps_*')
]

for p in mail_paths:
    matches = glob.glob(p)
    if matches:
        print("Found mail path:", matches)
