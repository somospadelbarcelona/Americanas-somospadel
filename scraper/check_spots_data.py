# -*- coding: utf-8 -*-
with open('scraper/halloween_script.json', 'r', encoding='utf-8') as f:
    text = f.read()

import re

for kw in ['spots_count', 'spots', 'teams_count', 'teams', 'participants', 'registered']:
    matches = [m.start() for m in re.finditer(kw, text, re.I)]
    print(f"Keyword '{kw}': {len(matches)} matches")
    for idx in matches[:4]:
        print("  ", text[max(0, idx-80):min(len(text), idx+120)])
