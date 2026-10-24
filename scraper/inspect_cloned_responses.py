import json
import re

with open('scraper/cloned_api_responses.json', 'r', encoding='utf-8') as f:
    responses = json.load(f)

print(f"Total API responses captured: {len(responses)}")
for r in responses:
    url = r['url']
    data = r['data']
    status = r['status']
    # skip assets/css/js
    if any(ext in url for ext in ['.js', '.css', '.svg', '.ttf', '.png', '.jpg']):
        continue
    print(f"[{status}] {url} (len {len(data)})")
    if any(k in data.lower() for k in ['participant', 'registration', 'players', 'player', 'teams', 'team']):
        # Find names
        names = re.findall(r'"name"\s*:\s*"([^"]+)"', data)
        if names:
            print(f"   Names in {url}:", names[:10])
        # Find full_name
        full_names = re.findall(r'"full_name"\s*:\s*"([^"]+)"', data)
        if full_names:
            print(f"   Full names in {url}:", full_names[:10])
