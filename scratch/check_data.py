import json
import re

print("Reading scraper/teams_data_auto.js...")
try:
    with open('scraper/teams_data_auto.js', 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Try to find references to Gemma, Saavedra or 4FA
    for term in ['Gemma', 'Saavedra', '4FA', '4F', 'Rubi']:
        matches = [m.start() for m in re.finditer(term, content, re.IGNORECASE)]
        print(f"Term '{term}': found {len(matches)} times")
        for m in matches[:5]:
            print(f"  Context around {m}: {content[max(0, m-50):min(len(content), m+150)]}...")
except Exception as e:
    print("Error:", e)
