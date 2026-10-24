import os
import json

base = r'C:\Users\acoscolin\AppData\Local\Google\Chrome\User Data'
for d in os.listdir(base):
    pref_path = os.path.join(base, d, 'Preferences')
    if os.path.exists(pref_path):
        try:
            with open(pref_path, 'r', encoding='utf-8', errors='ignore') as f:
                pref = json.load(f)
                account_info = pref.get('account_info', [])
                name = pref.get('profile', {}).get('name', '')
                print(f'{d}: name="{name}"')
                for acc in account_info:
                    print(f'   Account: {acc.get("email")}')
        except Exception as e:
            pass
