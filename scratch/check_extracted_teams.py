import os
import re
import json

base_dir = os.path.dirname(os.path.abspath(__file__))
teams_file_path = os.path.join(base_dir, '..', 'scraper', 'teams_data_auto.js')

with open(teams_file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Busquemos los IDs y Nombres y Categorías
matches = re.findall(r'"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)",\s*"category":\s*"([^"]+)"', content)

print("Equipos encontrados en scraper/teams_data_auto.js:")
for match in matches:
    print(f"- ID: {match[0]}, Nombre: {match[1]}, Categoría: {match[2]}")
