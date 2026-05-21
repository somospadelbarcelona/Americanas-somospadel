import os
import re

base_dir = os.path.dirname(os.path.abspath(__file__))
index_html_path = os.path.join(base_dir, '..', 'index.html')

with open(index_html_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- BÚSQUEDA EN index.html ---")
queries = ["teams_data", "TeamController", "TeamView", "Jornadas"]

for query in queries:
    print(f"\nResultados para '{query}':")
    for idx, line in enumerate(lines):
        if re.search(re.escape(query), line, re.IGNORECASE):
            print(f"Línea {idx + 1}: {line.strip()[:150]}")
