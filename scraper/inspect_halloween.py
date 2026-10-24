# -*- coding: utf-8 -*-
with open('scraper/halloween_script.json', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# Look for all matches with word characters, names or descriptions
title = re.search(r'"title":"([^"]+)"', text)
desc = re.search(r'"description":"([^"]+)"', text)
print("Title:", title.group(1) if title else "None")
print("Desc:", desc.group(1) if desc else "None")

# Search for any string that looks like a person's name or attendee
# In Next.js RSC, strings are encoded. Let's find all text fragments.
fragments = re.findall(r'"([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)"', text)
print("Capitalized names / phrases found:", len(fragments))
for fr in set(fragments):
    if len(fr) > 5 and not any(skip in fr for skip in ['Playtomic', 'Next', 'React', 'Google', 'Apple', 'Android', 'Padel', 'Pàdel', 'Barcelona', 'El Prat', 'Halloween', 'Americanas']):
        print("  Candidate:", fr)
