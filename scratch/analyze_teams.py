import re
import json
import os

teams_data_path = os.path.join(os.path.dirname(__file__), '..', 'js', 'modules', 'teams', 'teams_data.js')

with open(teams_data_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Look for window.ClubTeamsData = [ ... ];
# Since there could be code or other things, let's extract the list.
# We can find the start from window.ClubTeamsData = [
match = re.search(r'window\.ClubTeamsData\s*=\s*(\[\s*\{.*\}\s*\]);?', content, re.DOTALL)
if not match:
    # Try a more relaxed search
    match = re.search(r'window\.ClubTeamsData\s*=\s*(\[.*\]);?\s*\}\)\(\);', content, re.DOTALL)

if match:
    try:
        raw_json = match.group(1)
        # Remove any trailing semicolons or JavaScript comments if any
        # (Though usually it's clean JSON)
        teams = json.loads(raw_json)
        print(f"Encontrados {len(teams)} equipos en teams_data.js:")
        for t in teams:
            roster_len = len(t.get('roster', []))
            print(f"- {t.get('name')} (ID: {t.get('id')}, Integrantes: {roster_len})")
    except Exception as e:
        print("Error parsing JSON:", e)
        # Let's print a small slice to see what failed
        print(raw_json[:500])
else:
    print("No se encontró window.ClubTeamsData en el archivo.")
