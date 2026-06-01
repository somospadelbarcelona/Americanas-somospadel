import re
import json
import os
import urllib.request
import urllib.parse
import unicodedata

PROJECT_ID = "americanas-somospadel"
FIRESTORE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

def normalize_name(name):
    if not name:
        return ""
    # Normalize unicode and strip accents, lower case, replace non-alphanumeric with spaces
    name = unicodedata.normalize('NFD', name)
    name = "".join([c for c in name if unicodedata.category(c) != 'Mn'])
    name = name.lower().strip()
    # Normalize spaces
    name = re.sub(r'\s+', ' ', name)
    return name

# 1. Read teams_data.js and extract rosters
teams_data_path = os.path.join(os.path.dirname(__file__), '..', 'js', 'modules', 'teams', 'teams_data.js')
with open(teams_data_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'window\.ClubTeamsData\s*=\s*(\[.*\]);?\s*\}\)\(\);', content, re.DOTALL)
if not match:
    # Relaxed search
    match = re.search(r'window\.ClubTeamsData\s*=\s*(\[.*\]);?', content, re.DOTALL)

club_players = set()
teams_rosters = {}

if match:
    try:
        raw_json = match.group(1)
        teams = json.loads(raw_json)
        for t in teams:
            team_name = t.get('name', 'Equipo Desconocido')
            roster = t.get('roster', [])
            teams_rosters[team_name] = []
            for player in roster:
                p_name = player.get('name', '')
                if p_name:
                    club_players.add(normalize_name(p_name))
                    teams_rosters[team_name].append(p_name)
        print(f"[OK] Se han cargado {len(club_players)} jugadores unicos desde los rosters de los equipos en js.")
    except Exception as e:
        print("[ERROR] Error al parsear JSON de equipos:", e)
        exit(1)
else:
    print("[ERROR] No se encontro window.ClubTeamsData en el archivo teams_data.js.")
    exit(1)

# Get all players from Firestore with pagination support
print("Obteniendo jugadores desde Firestore de forma publica...")
players = []
next_page_token = None

while True:
    url = f"{FIRESTORE_URL}/players?pageSize=300"
    if next_page_token:
        url += f"&pageToken={next_page_token}"
    
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            docs = data.get('documents', [])
            players.extend(docs)
            next_page_token = data.get('nextPageToken')
            if not next_page_token:
                break
    except Exception as e:
        print("[ERROR] Error al obtener jugadores:", e)
        exit(1)

print(f"[OK] Se han obtenido {len(players)} jugadores de la base de datos Firestore.")

# 3. Analyze and Update
admin_roles = {'super_admin', 'superadmin', 'admin', 'admin_player', 'captain', 'capitan', 'capitanes'}

to_update = []
already_correct = 0
not_in_roster = 0
admin_skip = 0

for doc in players:
    doc_id = doc['name'].split('/')[-1]
    fields = doc.get('fields', {})
    
    name = from_fs = fields.get('name', {}).get('stringValue', '')
    role = fields.get('role', {}).get('stringValue', 'player')
    membership = fields.get('membership', {}).get('stringValue', '')
    
    # Check if assigned to any team in Firestore
    team_somospadel = fields.get('team_somospadel', {})
    has_teams_in_db = False
    
    if 'arrayValue' in team_somospadel:
        vals = team_somospadel['arrayValue'].get('values', [])
        if len(vals) > 0:
            has_teams_in_db = True
    elif 'stringValue' in team_somospadel:
        val_str = team_somospadel['stringValue']
        if val_str and val_str.strip():
            has_teams_in_db = True
            
    norm_name = normalize_name(name)
    in_js_roster = norm_name in club_players
    
    # Is eligible for player_somospadel?
    # Assigned to any team in SomosPadel BCN (either in JS roster or has teams in DB)
    is_club_player = in_js_roster or has_teams_in_db
    
    if is_club_player:
        if role in admin_roles:
            admin_skip += 1
        elif role == 'player_somospadel' and membership == 'somospadel_bcn':
            already_correct += 1
        else:
            to_update.append({
                "id": doc_id,
                "name": name,
                "current_role": role,
                "current_membership": membership,
                "reason": "En roster de JS" if in_js_roster else "Tiene equipos asignados en BD"
            })
    else:
        not_in_roster += 1

print("\nDiagnostico Inicial:")
print(f"- Jugadores con rol correcto: {already_correct}")
print(f"- Jugadores no asignados a equipos (externos): {not_in_roster}")
print(f"- Administradores omitidos: {admin_skip}")
print(f"- Jugadores a actualizar al rol 'player_somospadel': {len(to_update)}")

if not to_update:
    print("\nTodos los jugadores asignados a equipos ya tienen el rol correcto!")
    exit(0)

print("\nIniciando actualizacion masiva de roles...")
updated_count = 0
failed_count = 0

for item in to_update:
    doc_id = item['id']
    name = item['name']
    reason = item['reason']
    
    # PATCH payload
    payload = {
        "fields": {
            "role": { "stringValue": "player_somospadel" },
            "membership": { "stringValue": "somospadel_bcn" }
        }
    }
    
    # Target only specific fields to avoid modifying other data
    url = f"{FIRESTORE_URL}/players/{doc_id}?updateMask.fieldPaths=role&updateMask.fieldPaths=membership"
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    
    try:
        with urllib.request.urlopen(req) as res:
            safe_name = name.encode('ascii', 'ignore').decode('ascii')
            print(f"[OK] Actualizado: {safe_name} (Motivo: {reason}) | Rol: {item['current_role']} -> player_somospadel")
            updated_count += 1
    except Exception as e:
        safe_name = name.encode('ascii', 'ignore').decode('ascii')
        print(f"[ERROR] Error al actualizar {safe_name} ({doc_id}): {e}")
        failed_count += 1

print(f"\nProceso Completado:")
print(f"- Total actualizados con exito: {updated_count}")
print(f"- Errores: {failed_count}")
