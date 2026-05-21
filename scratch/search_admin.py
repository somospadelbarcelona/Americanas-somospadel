import os
import re

base_dir = os.path.dirname(os.path.abspath(__file__))
admin_html_path = os.path.join(base_dir, '..', 'admin.html')

with open(admin_html_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- BÚSQUEDA EN admin.html (Python) ---")
queries = ["club_teams", "ExtractedTeamsData", "teams_data_auto.js", "teams_data", "SINCRO"]

for query in queries:
    print(f"\nResultados para '{query}':")
    for idx, line in enumerate(lines):
        if re.search(re.escape(query), line, re.IGNORECASE):
            print(f"Línea {idx + 1}: {line.strip()[:150]}")
