def get_configured_uuids():
    """Lee únicamente los UUIDs explícitamente configurados por el usuario en URLS_FILE."""
    uuids = set()
    if os.path.exists(URLS_FILE):
        try:
            with open(URLS_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        m = re.search(r'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', line, re.I)
                        if m:
                            uuids.add(m.group(1).lower())
        except Exception:
            pass
    return list(uuids)

# -*- coding: utf-8 -*-
"""
🤖 MOTOR DE AUTOMATIZACIÓN AUTÓNOMA PLAYTOMIC ⇄ SOMOS PÁDEL
============================================================
Detecta automáticamente nuevas americanas creadas en Playtomic para:
  1. Club NEW Play Padel Pro Hospitalet (Organizador: somospadeleugestion@gmail.com)
  2. Barcelona Pádel El Prat (Organizador: Eduard Bainad Puig / "AMERICANA SOMOS PÁDEL BCN")

Revisa exhaustivamente:
  - Pistas reales (calculadas y verificadas)
  - Cartel oficial HD de Playtomic (Cloudinary)
  - Tipo de americana: Pareja Fija vs Twister individual
  - Precio oficial de Playtomic (ej. 12.48 €)
  - Sincronización en vivo con Firestore y almacenamiento local
"""

import os
import sys
import re
import json
import time
import glob
import shutil
import sqlite3
import tempfile
import argparse
import urllib.request
import urllib.error
from datetime import datetime, timezone
_DIR = os.path.dirname(os.path.abspath(__file__))
_PARENT = os.path.dirname(_DIR)
if _DIR not in sys.path:
    sys.path.insert(0, _DIR)
if _PARENT not in sys.path:
    sys.path.insert(0, _PARENT)

try:
    from scraper.playtomic_authenticated_fetcher import playtomic_login, fetch_tournament_participants, fetch_club_tournaments
except ImportError:
    from playtomic_authenticated_fetcher import playtomic_login, fetch_tournament_participants, fetch_club_tournaments

_TOKEN_CACHE = {"token": None, "ts": 0}
_API_TOURNAMENT_CACHE = {}

def utc_iso_to_madrid(iso_str):
    """Convierte fecha/hora ISO UTC de la API de Playtomic a hora local de Madrid (Europe/Madrid)."""
    if not iso_str:
        return None
    try:
        from datetime import timedelta
        from zoneinfo import ZoneInfo
        clean = str(iso_str).replace("Z", "").split(".")[0]
        dt_utc = datetime.fromisoformat(clean).replace(tzinfo=timezone.utc)
        return dt_utc.astimezone(ZoneInfo("Europe/Madrid"))
    except Exception:
        try:
            from datetime import timedelta
            clean = str(iso_str).replace("Z", "").split(".")[0]
            dt_utc = datetime.fromisoformat(clean).replace(tzinfo=timezone.utc)
            offset = 2 if 4 <= dt_utc.month <= 10 else 1
            return dt_utc.astimezone(timezone(timedelta(hours=offset)))
        except Exception:
            return None

def get_playtomic_auth_token():
    """Obtiene y cachea el token de sesión autenticada de Playtomic."""
    import time
    now = time.time()
    if _TOKEN_CACHE["token"] and (now - _TOKEN_CACHE["ts"]) < 3000:
        return _TOKEN_CACHE["token"]
    auth = playtomic_login('somospadeleugestion@gmail.com', 'Factor2000!')
    if auth.get("success"):
        _TOKEN_CACHE["token"] = auth["access_token"]
        _TOKEN_CACHE["ts"] = now
        return _TOKEN_CACHE["token"]
    return None

def fetch_playtomic_real_players(tournament_id, sede="Club Oficial", organizer="Somospadel", force_fixed=False, api_data=None):
    """Descarga de forma 100% autónoma los nombres, fotos y niveles reales de los inscritos, respetando parejas oficiales y balanceando los libres."""
    if not api_data:
        api_data = _API_TOURNAMENT_CACHE.get(str(tournament_id).lower())
    if not api_data:
        token = get_playtomic_auth_token()
        if not token:
            return [], [], False
        res = fetch_tournament_participants(tournament_id, token)
        if not res.get("success"):
            return [], [], False
        api_data = res["data"]
        _API_TOURNAMENT_CACHE[str(tournament_id).lower()] = api_data
    
    teams = api_data.get("teams", [])
    now_iso = datetime.now(timezone.utc).isoformat()
    
    has_teams_of_two = any(len(t.get("players", [])) == 2 for t in teams)
    is_pairs_tournament = force_fixed or has_teams_of_two
    
    official_pairs = []
    unpaired_players = []
    all_players = []
    
    for t_idx, team in enumerate(teams, 1):
        team_players = team.get("players", [])
        team_id = team.get("team_id", f"t_{t_idx}")
        
        if len(team_players) == 2:
            p1_raw = team_players[0]
            p2_raw = team_players[1]
            u1 = p1_raw.get("user_id") or f"{t_idx}_1"
            u2 = p2_raw.get("user_id") or f"{t_idx}_2"
            
            p1_id = f"pt_{u1}"
            p2_id = f"pt_{u2}"
            pair_id = f"pair_pt_{str(team_id)[:8]}"
            
            p1_lvl = float(p1_raw.get("level_value") or 3.5)
            p2_lvl = float(p2_raw.get("level_value") or 3.5)
            p1_name = p1_raw.get("name") or f"Jugador #{len(all_players)+1}"
            p2_name = p2_raw.get("name") or f"Jugador #{len(all_players)+2}"
            
            p1_obj = {
                "id": p1_id,
                "uid": p1_id,
                "user_id": str(u1),
                "name": p1_name,
                "display_name": p1_name,
                "level": p1_lvl,
                "photoURL": p1_raw.get("picture"),
                "photo_url": p1_raw.get("picture"),
                "picture": p1_raw.get("picture"),
                "gender": p1_raw.get("gender") or "?",
                "position": "Drive",
                "pair_id": pair_id,
                "partner_name": p2_name,
                "partner_id": p2_id,
                "source": "playtomic",
                "is_external": True,
                "is_playtomic": True,
                "playtomic_status": "confirmed",
                "price_paid": 12.48,
                "club": sede,
                "organizer": organizer,
                "joinedAt": now_iso
            }
            p2_obj = {
                "id": p2_id,
                "uid": p2_id,
                "user_id": str(u2),
                "name": p2_name,
                "display_name": p2_name,
                "level": p2_lvl,
                "photoURL": p2_raw.get("picture"),
                "photo_url": p2_raw.get("picture"),
                "picture": p2_raw.get("picture"),
                "gender": p2_raw.get("gender") or "?",
                "position": "Revés",
                "pair_id": pair_id,
                "partner_name": p1_name,
                "partner_id": p1_id,
                "source": "playtomic",
                "is_external": True,
                "is_playtomic": True,
                "playtomic_status": "confirmed",
                "price_paid": 12.48,
                "club": sede,
                "organizer": organizer,
                "joinedAt": now_iso
            }
            
            all_players.extend([p1_obj, p2_obj])
            avg_lvl = round((p1_lvl + p2_lvl) / 2.0, 2)
            official_pairs.append({
                "id": pair_id,
                "pair_name": f"{p1_name} / {p2_name}",
                "player1_id": p1_id,
                "player1_name": p1_name,
                "player1_photo": p1_raw.get("picture") or "",
                "player1_level": p1_lvl,
                "player2_id": p2_id,
                "player2_name": p2_name,
                "player2_photo": p2_raw.get("picture") or "",
                "player2_level": p2_lvl,
                "avg_level": avg_lvl,
                "wins": 0,
                "losses": 0,
                "games_won": 0,
                "games_lost": 0,
                "points": 0,
                "is_official_playtomic": True,
                "_p1": p1_obj,
                "_p2": p2_obj
            })
        elif len(team_players) == 1:
            p_raw = team_players[0]
            u = p_raw.get("user_id") or f"{t_idx}_1"
            pid = f"pt_{u}"
            lvl = float(p_raw.get("level_value") or 3.5)
            pname = p_raw.get("name") or f"Jugador #{len(all_players)+1}"
            
            p_obj = {
                "id": pid,
                "uid": pid,
                "user_id": str(u),
                "name": pname,
                "display_name": pname,
                "level": lvl,
                "photoURL": p_raw.get("picture"),
                "photo_url": p_raw.get("picture"),
                "picture": p_raw.get("picture"),
                "gender": p_raw.get("gender") or "?",
                "position": "Revés" if lvl > 3.6 else "Drive",
                "pair_id": None,
                "partner_name": None,
                "partner_id": None,
                "source": "playtomic",
                "is_external": True,
                "is_playtomic": True,
                "playtomic_status": "confirmed",
                "price_paid": 12.48,
                "club": sede,
                "organizer": organizer,
                "joinedAt": now_iso
            }
            all_players.append(p_obj)
            unpaired_players.append(p_obj)

    fixed_pairs_list = []
    if is_pairs_tournament:
        if tournament_id == '46011a01-68b4-433f-b2e3-581ca5fabfdb':
            # Cuadro inicial exacto y validado desde Playtomic Manager (Foto 2)
            player_by_id = {p['id']: p for p in all_players}
            exact_mapping = [
                {'c': 1, 'p1': 'pt_2086399', 'p2': 'pt_5080468', 'id': 'pair_pt_0b1bb356', 'ofic': True},
                {'c': 1, 'p1': 'pt_1410091', 'p2': 'pt_1919151', 'id': 'pair_pt_3f905fef', 'ofic': True},
                {'c': 2, 'p1': 'pt_56391', 'p2': 'pt_35769', 'id': 'pair_pt_0c7b6162', 'ofic': True},
                {'c': 2, 'p1': 'pt_3027764', 'p2': 'pt_15936303', 'id': 'pair_pt_bal_302776_159363', 'ofic': False},
                {'c': 3, 'p1': 'pt_4323394', 'p2': 'pt_3066330', 'id': 'pair_pt_bal_432339_306633', 'ofic': False},
                {'c': 3, 'p1': 'pt_119105', 'p2': 'pt_1587815', 'id': 'pair_pt_bal_119105_158781', 'ofic': False},
                {'c': 4, 'p1': 'pt_3386971', 'p2': 'pt_112538', 'id': 'pair_pt_d13735f4', 'ofic': True},
                {'c': 4, 'p1': 'pt_17756166', 'p2': 'pt_3344486', 'id': 'pair_pt_bal_177561_334448', 'ofic': False},
                {'c': 5, 'p1': 'pt_778440', 'p2': 'pt_748421', 'id': 'pair_pt_c6ad96ad', 'ofic': True},
                {'c': 5, 'p1': 'pt_5277942', 'p2': 'pt_9362589', 'id': 'pair_pt_62bbbb7d', 'ofic': True}
            ]
            for m in exact_mapping:
                p1 = player_by_id.get(m['p1'])
                p2 = player_by_id.get(m['p2'])
                if p1 and p2:
                    p1['court'] = str(m['c'])
                    p1['pair_id'] = m['id']
                    p1['partner_id'] = p2['id']
                    p1['partner_name'] = p2['name']
                    p2['court'] = str(m['c'])
                    p2['pair_id'] = m['id']
                    p2['partner_id'] = p1['id']
                    p2['partner_name'] = p1['name']
                    avg_val = round((p1['level'] + p2['level']) / 2.0, 2)
                    fixed_pairs_list.append({
                        'id': m['id'],
                        'pair_name': f"{p1['name']} / {p2['name']}",
                        'player1_id': p1['id'],
                        'player1_name': p1['name'],
                        'player1_photo': p1.get('photoURL') or '',
                        'player1_level': p1['level'],
                        'player2_id': p2['id'],
                        'player2_name': p2['name'],
                        'player2_photo': p2.get('photoURL') or '',
                        'player2_level': p2['level'],
                        'avg_level': avg_val,
                        'current_court': m['c'],
                        'initial_court': m['c'],
                        'court': m['c'],
                        'wins': 0,
                        'losses': 0,
                        'games_won': 0,
                        'games_lost': 0,
                        'points': 0,
                        'is_official_playtomic': m['ofic']
                    })
        else:
                # Agrupar compensativamente los jugadores libres por nivel (alto con bajo)
            unpaired_players.sort(key=lambda p: p["level"], reverse=True)
            n_unpaired = len(unpaired_players)
            balanced_pairs = []
            for i in range(n_unpaired // 2):
                p_high = unpaired_players[i]
                p_low = unpaired_players[n_unpaired - 1 - i]
                b_pair_id = f"pair_pt_bal_{str(p_high.get('user_id', ''))[:6]}_{str(p_low.get('user_id', ''))[:6]}"
                
                p_high["pair_id"] = b_pair_id
                p_high["partner_id"] = p_low["id"]
                p_high["partner_name"] = p_low["name"]
                
                p_low["pair_id"] = b_pair_id
                p_low["partner_id"] = p_high["id"]
                p_low["partner_name"] = p_high["name"]
                
                avg_b = round((p_high["level"] + p_low["level"]) / 2.0, 2)
                balanced_pairs.append({
                    "id": b_pair_id,
                    "pair_name": f"{p_high['name']} / {p_low['name']}",
                    "player1_id": p_high["id"],
                    "player1_name": p_high["name"],
                    "player1_photo": p_high.get("photoURL") or "",
                    "player1_level": p_high["level"],
                    "player2_id": p_low["id"],
                    "player2_name": p_low["name"],
                    "player2_photo": p_low.get("photoURL") or "",
                    "player2_level": p_low["level"],
                    "avg_level": avg_b,
                    "wins": 0,
                    "losses": 0,
                    "games_won": 0,
                    "games_lost": 0,
                    "points": 0,
                    "is_official_playtomic": False,
                    "_p1": p_high,
                    "_p2": p_low
                })
                
                all_combined_pairs = official_pairs + balanced_pairs
                # Ordenar todas las parejas por nivel medio descendente para cruce equitativo
                all_combined_pairs.sort(key=lambda fp: fp["avg_level"], reverse=True)
                
                for idx, fp in enumerate(all_combined_pairs):
                    court_num = (idx // 2) + 1
                    fp["current_court"] = court_num
                    fp["initial_court"] = court_num
                    fp["court"] = court_num
                    if "_p1" in fp:
                        fp["_p1"]["court"] = court_num
                    if "_p2" in fp:
                        fp["_p2"]["court"] = court_num
                    
                    fp_clean = {k: v for k, v in fp.items() if not k.startswith("_")}
                    fixed_pairs_list.append(fp_clean)
                
    return all_players, fixed_pairs_list, is_pairs_tournament

WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRAPER_DIR = os.path.join(WORKSPACE_DIR, "scraper")
URLS_FILE = os.path.join(SCRAPER_DIR, "playtomic_tournaments_urls.txt")
DELETED_FILE = os.path.join(SCRAPER_DIR, "playtomic_deleted_uuids.txt")
OUTPUT_JSON = os.path.join(SCRAPER_DIR, "playtomic_extracted.json")
LOG_FILE = os.path.join(SCRAPER_DIR, "playtomic_daemon.log")

FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents/americanas"
FIREBASE_API_KEY = "AIzaSyBCy8nN4wKL2Cqvxp_mkmYpsA923N1g5iE"

KNOWN_TENANTS = {
    "bd2ea8dd-4c1d-4e64-98eb-3ff2ab9b2051": {
        "club": "NEW Play Padel Pro Hospitalet",
        "organizer": "somospadeleugestion@gmail.com",
        "default_name": "AMERICANA HALLOWEEN"
    },
    "da77c69a-43b3-11e8-8674-52540049669c": {
        "club": "Barcelona Pádel El Prat",
        "organizer": "Eduard Bainad Puig",
        "default_name": "AMERICANA SOMOS PÁDEL BCN"
    }
}

def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    try:
        out_enc = sys.stdout.encoding or 'utf-8'
        print(line.encode(out_enc, errors='replace').decode(out_enc))
    except Exception:
        print(line.encode('ascii', errors='replace').decode('ascii'))
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass

def fetch_html(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        log(f"⚠️ Error descargando HTML de {url}: {e}")
        return None

def extract_tournament_uuids_from_browser():
    """Descubre de forma autónoma enlaces a torneos de Playtomic visitados recientemente en Chrome/Edge."""
    discovered = set()
    user_data = os.path.expanduser(r"~\AppData\Local\Google\Chrome\User Data")
    if not os.path.exists(user_data):
        return discovered

    profiles = glob.glob(os.path.join(user_data, "Profile *")) + [os.path.join(user_data, "Default")]
    for p in profiles:
        hist_file = os.path.join(p, "History")
        if not os.path.exists(hist_file):
            continue
        tmp = os.path.join(tempfile.gettempdir(), f"crawl_hist_{os.path.basename(p)}.db")
        try:
            shutil.copy2(hist_file, tmp)
            conn = sqlite3.connect(tmp)
            c = conn.cursor()
            c.execute("SELECT url FROM urls WHERE url LIKE '%playtomic.%/tournaments/%' ORDER BY last_visit_time DESC LIMIT 40")
            for row in c.fetchall():
                m = re.search(r'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', row[0], re.I)
                if m:
                    discovered.add(m.group(1).lower())
            conn.close()
            os.remove(tmp)
        except Exception:
            pass
    return discovered

def extract_tournament_uuids_from_club_pages():
    """Descubre de forma 100% autónoma todas las americanas oficiales directamente desde la API v2 de Playtomic Manager para ambos clubes."""
    discovered = set()
    token = get_playtomic_auth_token()
    external_brands = [
        "vibra", "siux", "jaleo", "crazyxpadel", "crazy", "breakfast",
        "grx", "beerpoint", "mahou", "cries padel", "padel amateur", "babolat", "vermouthera"
    ]

    if token:
        clubs = [
            ("Hospitalet", "bd2ea8dd-4c1d-4e64-98eb-3ff2ab9b2051"),
            ("El Prat", "da77c69a-43b3-11e8-8674-52540049669c")
        ]
        for club_label, tid in clubs:
            res = fetch_club_tournaments(tid, token, size=200)
            if res.get("success"):
                for item in res.get("data", []):
                    t_uuid = str(item.get("tournament_id") or "").strip().lower()
                    if not t_uuid:
                        continue
                    _API_TOURNAMENT_CACHE[t_uuid] = item
                    if item.get("status") == "CANCELED":
                        continue
                    name_low = (item.get("name") or "").lower()
                    if any(b in name_low for b in external_brands):
                        continue
                    rel = item.get("related_users") or []
                    org_ids = [str(r.get("user_id")) for r in rel if r.get("type") == "ORGANIZER"]
                    desc_low = ((item.get("metadata") or {}).get("description") or "").lower()

                    if club_label == "Hospitalet":
                        # En NEW Play Padel Pro Hospitalet: organizador somospadel barcelona (user_id 17701167)
                        is_ours = ("17701167" in org_ids) or ("somos" in name_low) or ("somos" in desc_low)
                    else:
                        # En Barcelona Pádel El Prat: organizadas por Eduard Bainad Puig para Somos Pádel Barcelona
                        is_ours = ("somos" in name_low) or ("somos" in desc_low)

                    if is_ours:
                        discovered.add(t_uuid)

    # También revisar cola de sincronización en Firestore (enlaces pegados desde el Admin Web)
    try:
        q_url = f"https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents/playtomic_sync_queue?key={FIREBASE_API_KEY}"
        req = urllib.request.Request(q_url)
        with urllib.request.urlopen(req, timeout=8) as resp:
            q_data = json.loads(resp.read().decode("utf-8"))
            for doc in q_data.get("documents", []):
                f = doc.get("fields", {})
                u_val = (f.get("uuid", {}).get("stringValue") or doc["name"].split("/")[-1]).strip().lower()
                if re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', u_val):
                    discovered.add(u_val)
    except Exception:
        pass

    # Fallback complementario desde páginas públicas
    club_urls = [
        "https://playtomic.io/clubs/new-play-padel-pro-hospitalet",
        "https://playtomic.io/clubs/padel-barcelona-el-prat"
    ]
    for url in club_urls:
        html = fetch_html(url)
        if html:
            matches = re.findall(r'/tournaments/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', html, re.I)
            for m in matches:
                discovered.add(m.lower())
    return discovered

def get_deleted_uuids():
    """Obtiene el conjunto de IDs y UUIDs eliminados permanentemente desde el Admin (local + Firestore)."""
    deleted = set()
    if os.path.exists(DELETED_FILE):
        try:
            with open(DELETED_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    val = line.strip().lower()
                    if val and not val.startswith("#"):
                        deleted.add(val)
                        if len(val) >= 8 and "-" in val:
                            deleted.add(val[:8])
                            deleted.add(f"pt_{val[:8]}")
        except Exception:
            pass
    try:
        del_url = f"https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents/playtomic_deleted?pageSize=200&key={FIREBASE_API_KEY}"
        with urllib.request.urlopen(urllib.request.Request(del_url), timeout=6) as resp:
            d_data = json.loads(resp.read().decode("utf-8"))
            for doc in d_data.get("documents", []):
                doc_name = doc["name"].split("/")[-1].strip().lower()
                deleted.add(doc_name)
                f = doc.get("fields", {})
                u_val = (f.get("uuid", {}).get("stringValue") or "").strip().lower()
                id_val = (f.get("doc_id", {}).get("stringValue") or "").strip().lower()
                if u_val:
                    deleted.add(u_val)
                    deleted.add(u_val[:8])
                    deleted.add(f"pt_{u_val[:8]}")
                if id_val:
                    deleted.add(id_val)
                    if id_val.startswith("pt_"):
                        deleted.add(id_val[3:])
    except Exception:
        pass
    return deleted

def mark_tournament_deleted(uuid_or_id, doc_id=None):
    """Elimina totalmente una americana (local + Firestore) y la registra en la lista negra para que nunca vuelva a sincronizarse."""
    clean_val = str(uuid_or_id or "").strip().lower()
    clean_doc = str(doc_id or "").strip()
    if not clean_doc and clean_val:
        if clean_val.startswith("pt_") or len(clean_val) > 15:
            clean_doc = clean_val if not ("-" in clean_val) else f"pt_{clean_val[:8]}"
        else:
            clean_doc = f"pt_{clean_val[:8]}"

    # 1. Guardar en archivo local de eliminados
    existing = set()
    if os.path.exists(DELETED_FILE):
        try:
            with open(DELETED_FILE, "r", encoding="utf-8") as f:
                existing = {l.strip().lower() for l in f if l.strip()}
        except Exception:
            pass
    if clean_val:
        existing.add(clean_val)
    if clean_doc:
        existing.add(clean_doc.lower())
    try:
        with open(DELETED_FILE, "w", encoding="utf-8") as f:
            for item in sorted(existing):
                f.write(item + "\n")
    except Exception as e:
        log(f"⚠️ Error guardando en {DELETED_FILE}: {e}")

    # 2. Eliminar de playtomic_tournaments_urls.txt si estaba
    if os.path.exists(URLS_FILE):
        try:
            with open(URLS_FILE, "r", encoding="utf-8") as f:
                lines = f.readlines()
            prefix = clean_val[:8] if clean_val else "___"
            kept = [l for l in lines if (clean_val not in l.lower() and prefix not in l.lower())]
            with open(URLS_FILE, "w", encoding="utf-8") as f:
                f.writelines(kept)
        except Exception:
            pass

    # 3. Eliminar de playtomic_extracted.json si estaba
    if os.path.exists(OUTPUT_JSON):
        try:
            with open(OUTPUT_JSON, "r", encoding="utf-8") as f:
                arr = json.load(f)
            filtered = [
                x for x in arr
                if str(x.get("playtomic_id") or "").lower() != clean_val
                and str(x.get("doc_id") or "").lower() != clean_doc.lower()
            ]
            with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
                json.dump(filtered, f, indent=2, ensure_ascii=False)
        except Exception:
            pass

    # 4. Registrar en Firestore playtomic_deleted
    del_key = clean_val if clean_val else clean_doc
    if del_key:
        try:
            fs_del_url = f"https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents/playtomic_deleted/{del_key}?key={FIREBASE_API_KEY}"
            payload = json.dumps({
                "fields": {
                    "uuid": {"stringValue": clean_val},
                    "doc_id": {"stringValue": clean_doc},
                    "deletedAt": {"stringValue": datetime.now(timezone.utc).isoformat()}
                }
            }).encode("utf-8")
            req = urllib.request.Request(fs_del_url, data=payload, headers={"Content-Type": "application/json"}, method="PATCH")
            urllib.request.urlopen(req, timeout=8)
        except Exception:
            pass

    # 5. Borrar documento de Firestore americanas
    if clean_doc:
        try:
            fs_doc_url = f"{FIRESTORE_BASE}/{clean_doc}?key={FIREBASE_API_KEY}"
            req = urllib.request.Request(fs_doc_url, method="DELETE")
            urllib.request.urlopen(req, timeout=8)
            log(f"🗑️ [ELIMINADO TOTALMENTE] Documento '{clean_doc}' ({clean_val}) borrado de Firestore y bloqueado.")
        except Exception:
            pass
    return True

def unmark_tournament_deleted(uuid_str):
    """Si el admin vuelve a pegar manualmente el enlace de un torneo eliminado, lo rehabilita."""
    clean_u = str(uuid_str or "").strip().lower()
    if not clean_u:
        return
    prefix = clean_u[:8]
    if os.path.exists(DELETED_FILE):
        try:
            with open(DELETED_FILE, "r", encoding="utf-8") as f:
                lines = [l.strip() for l in f if l.strip()]
            kept = [l for l in lines if l.lower() not in (clean_u, prefix, f"pt_{prefix}")]
            with open(DELETED_FILE, "w", encoding="utf-8") as f:
                for item in kept:
                    f.write(item + "\n")
        except Exception:
            pass
    for k in (clean_u, f"pt_{prefix}"):
        try:
            fs_del_url = f"https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents/playtomic_deleted/{k}?key={FIREBASE_API_KEY}"
            urllib.request.urlopen(urllib.request.Request(fs_del_url, method="DELETE"), timeout=5)
        except Exception:
            pass

def get_all_target_uuids(deep_discovery=False):
    """Reúne los torneos Playtomic configurados y opcionalmente descubre nuevos en la web o navegador, excluyendo los eliminados."""
    uuids = set()
    if os.path.exists(URLS_FILE):
        try:
            with open(URLS_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        m = re.search(r'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', line, re.I)
                        if m:
                            uuids.add(m.group(1).lower())
        except Exception as e:
            log(f"⚠️ Error leyendo {URLS_FILE}: {e}")

    if deep_discovery:
        # 1. Descubrir desde la API v2 y páginas oficiales de los clubes
        club_uuids = extract_tournament_uuids_from_club_pages()
        for u in club_uuids:
            uuids.add(u)

        # 2. Descubrir desde el navegador
        browser_uuids = extract_tournament_uuids_from_browser()
        for u in browser_uuids:
            uuids.add(u)

    deleted_set = get_deleted_uuids()
    final_uuids = [
        u for u in uuids
        if u.lower() not in deleted_set
        and u.lower()[:8] not in deleted_set
        and f"pt_{u.lower()[:8]}" not in deleted_set
    ]

    return sorted(list(set(final_uuids)))

def extract_playtomic_datetime(html):
    """
    Extrae con maxima precision la fecha, hora de inicio y fin desde el HTML de Playtomic.
    Soporta formato en ingles ('Wed, Nov 4 · 10:00 AM') y espanol ('Mie, 4 nov · 10:00').
    """
    raw_datetime = None
    
    # Intento 1: Etiqueta <p> con color de texto gris de Playtomic
    m = re.search(r'<p[^>]*class="[^"]*text-\[#566670\][^"]*"[^>]*>([^<]+)</p>', html)
    if m:
        raw_datetime = m.group(1).strip()
        
    # Intento 2: Atributos RSC / Next.js
    if not raw_datetime:
        m = re.search(r'"text-xs[^"]*","children":"([^"]+)"', html)
        if m:
            raw_datetime = m.group(1).strip()
            
    # Intento 3: Cualquier texto con dia de la semana y separador ·
    if not raw_datetime:
        m = re.search(r'(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Lun|Mar|Mie|Mié|Jue|Vie|Sab|Sáb|Dom)[^<>\n"]*·\s*([^<>\n"]+)', html, re.I)
        if m:
            raw_datetime = m.group(0).strip()

    now = datetime.now()
    default_date = now.strftime("%Y-%m-%d")
    
    if not raw_datetime:
        return default_date, "18:00", "20:00"

    raw_datetime = raw_datetime.replace('\u00a0', ' ').replace('&middot;', '·')
    
    # 1. Extraccion de Mes y Dia
    months = {
        "ene": "01", "jan": "01",
        "feb": "02",
        "mar": "03",
        "abr": "04", "apr": "04",
        "may": "05",
        "jun": "06",
        "jul": "07",
        "ago": "08", "aug": "08",
        "sep": "09", "set": "09",
        "oct": "10",
        "nov": "11",
        "dic": "12", "dec": "12"
    }
    
    month_num = None
    day_num = None
    
    # Formato A: "Nov 4" o "November 4"
    mA = re.search(r'([a-z]{3,})[a-z]*\s+(\d{1,2})', raw_datetime, re.I)
    if mA:
        prefix = mA.group(1).lower()[:3]
        if prefix in months:
            month_num = months[prefix]
            day_num = mA.group(2).zfill(2)
            
    # Formato B: "4 Nov" o "4 de Noviembre"
    if not month_num:
        mB = re.search(r'(\d{1,2})\s+(?:de\s+)?([a-z]{3,})', raw_datetime, re.I)
        if mB:
            prefix = mB.group(2).lower()[:3]
            if prefix in months:
                month_num = months[prefix]
                day_num = mB.group(1).zfill(2)
                
    if month_num and day_num:
        year = now.year
        date_str = f"{year}-{month_num}-{day_num}"
    else:
        day_match = re.search(r'(\d{1,2})', raw_datetime)
        day_num = day_match.group(1).zfill(2) if day_match else now.strftime("%d")
        date_str = f"{now.year}-{now.strftime('%m')}-{day_num}"

    # 2. Extraccion y normalizacion de Horario (12h AM/PM -> 24h)
    time_str = "18:00"
    time_end_str = "20:00"
    
    mT = re.search(r'(\d{1,2}):(\d{2})\s*(AM|PM)?', raw_datetime, re.I)
    if mT:
        hour = int(mT.group(1))
        minute = int(mT.group(2))
        ampm = mT.group(3)
        if ampm:
            ampm = ampm.upper()
            if ampm == "PM" and hour < 12:
                hour += 12
            elif ampm == "AM" and hour == 12:
                hour = 0
        time_str = f"{hour:02d}:{minute:02d}"
        
        # En padel / americanas, la duracion estandar es de 2 horas
        end_hour = hour + 2
        time_end_str = f"{end_hour:02d}:{minute:02d}"

    return date_str, time_str, time_end_str

def parse_playtomic_tournament(tournament_id):
    """Parsea exhaustivamente todos los datos necesarios de una americana creada en Playtomic usando la API v2 autenticada (con fallback a HTML)."""
    tid_clean = str(tournament_id).strip().lower()
    url = f"https://app.playtomic.com/tournaments/{tid_clean}"
    full_share_url = f"https://app.playtomic.com/tournaments/{tid_clean}?utm_source=app_android&utm_campaign=share"
    configured_uuids = [u.lower() for u in get_configured_uuids()]

    external_brands = [
        "vibra", "siux", "jaleo", "crazyxpadel", "crazy", "breakfast",
        "grx", "beerpoint", "mahou", "cries padel", "padel amateur", "babolat", "vermouthera"
    ]
    fixed_keywords = ["pareja fija", "por parejas", "en pareja", "parejas fijas", "duplas", "inscripcion en pareja", "inscripción por parejas"]
    twister_keywords = ["twister", "individual", "rotacion", "rotación", "pozo", "americano", "mexicano", "sin pareja fija"]

    # 1. Intentar obtener datos exactos desde la API v2 oficial de Playtomic Manager
    api_data = _API_TOURNAMENT_CACHE.get(tid_clean)
    if not api_data:
        token = get_playtomic_auth_token()
        if token:
            res = fetch_tournament_participants(tid_clean, token)
            if res.get("success") and res.get("data"):
                api_data = res["data"]
                _API_TOURNAMENT_CACHE[tid_clean] = api_data

    if api_data:
        api_status = str(api_data.get("status") or "").upper()
        if api_status == "CANCELED":
            log(f"   ⛔ DESCARTADO: Torneo {tid_clean} está CANCELADO en Playtomic.")
            return None

        name = (api_data.get("name") or "AMERICANA PLAYTOMIC").strip()
        name_lower = name.lower()
        tenant = api_data.get("tenant") or {}
        tenant_id = str(tenant.get("tenant_id") or "").strip()
        tenant_name = str(tenant.get("tenant_name") or "").strip()
        rel = api_data.get("related_users") or []
        org_ids = [str(r.get("user_id")) for r in rel if r.get("type") == "ORGANIZER"]
        desc_raw = str((api_data.get("metadata") or {}).get("description") or "")
        desc_lower = desc_raw.lower()

        if any(b in name_lower for b in external_brands):
            log(f"   ⛔ FILTRADO / DESCARTADO: '{name}' pertenece a una marca externa ajena a Somos Pádel.")
            return None

        is_el_prat = (
            "prat" in tenant_name.lower() or
            "prat" in name_lower or
            "prat" in desc_lower or
            tenant_id == "da77c69a-43b3-11e8-8674-52540049669c"
        )

        if is_el_prat:
            sede = "Barcelona Pádel El Prat"
            organizer = "Eduard Bainad Puig"
            is_somospadel_prat = (
                tid_clean in configured_uuids or
                "somos" in name_lower or
                "somos" in desc_lower
            )
            if not is_somospadel_prat:
                log(f"   ⛔ FILTRADO / DESCARTADO: '{name}' en El Prat no pertenece a Somos Pádel Barcelona.")
                return None
        else:
            sede = "NEW Play Padel Pro Hospitalet"
            organizer = "somospadel barcelona"
            is_somospadel_hosp = (
                "17701167" in org_ids or
                tid_clean in configured_uuids or
                "somos" in name_lower or
                "somos" in desc_lower
            )
            if not is_somospadel_hosp:
                log(f"   ⛔ FILTRADO / DESCARTADO: '{name}' en Hospitalet no pertenece a Somos Pádel Barcelona.")
                return None

        # Fecha y Hora en zona horaria Europe/Madrid
        dt_start = utc_iso_to_madrid(api_data.get("start_date"))
        dt_end = utc_iso_to_madrid(api_data.get("end_date"))
        if dt_start:
            date_str = dt_start.strftime("%Y-%m-%d")
            time_str = dt_start.strftime("%H:%M")
        else:
            date_str = datetime.now().strftime("%Y-%m-%d")
            time_str = "18:00"

        if dt_end:
            time_end_str = dt_end.strftime("%H:%M")
        else:
            time_end_str = "20:00"

        # Plazas y Pistas
        reg_info = api_data.get("registration_info") or {}
        total_spots = int(reg_info.get("max_players") or 20)
        avail = api_data.get("available_places")
        spots_left = int(avail) if avail is not None else total_spots
        occupied_spots = max(0, total_spots - spots_left)
        courts_count = max(2, int(total_spots / 4))

        # Precio Oficial (de configurations o descripción/título si el pago es en club)
        price_val = None
        for cfg in (reg_info.get("configurations") or []):
            p_str = str(cfg.get("price") or "")
            m_p = re.search(r'(\d+(?:[\.,]\d+)?)', p_str)
            if m_p:
                val_f = float(m_p.group(1).replace(",", "."))
                if val_f > 0:
                    if cfg.get("registration_type") == "SINGLE" or price_val is None:
                        price_val = f"{val_f:.2f}".rstrip("0").rstrip(".")

        if not price_val:
            m_desc_p = re.search(r'(\d+(?:[\.,]\d+)?)\s*€', name + " " + desc_raw)
            if m_desc_p:
                val_f = float(m_desc_p.group(1).replace(",", "."))
                price_val = f"{val_f:.2f}".rstrip("0").rstrip(".")
            else:
                price_val = "12"

        # Cartel Oficial HD
        poster_url = None
        api_imgs = api_data.get("images") or []
        if api_imgs:
            first_img = api_imgs[0]
            poster_url = first_img.get("url") if isinstance(first_img, dict) else str(first_img)
        if not poster_url:
            t_imgs = tenant.get("images") or []
            if t_imgs:
                poster_url = t_imgs[0]
        if not poster_url:
            poster_url = "img/padel-event.jpg"

        # Tipo de americana (Pareja Fija vs Twister)
        combined_text = (name_lower + " " + desc_lower)
        is_fixed_candidate = False
        if tid_clean == "46011a01-68b4-433f-b2e3-581ca5fabfdb" or "halloween" in name_lower:
            is_fixed_candidate = True
        elif any(k in combined_text for k in fixed_keywords) and "cambiar en cada ronda" not in combined_text:
            is_fixed_candidate = True
        elif any(k in combined_text for k in twister_keywords):
            is_fixed_candidate = False

        is_fixed = is_fixed_candidate
        pair_mode = "fixed" if is_fixed else "twister"
        format_type = "fixed" if is_fixed else "twister"

        # Categoría
        if "femenin" in name_lower:
            category = "femenina"
        elif "masculin" in name_lower:
            category = "masculina"
        elif "mixt" in name_lower:
            category = "mixta"
        else:
            category = "open"

    else:
        # Fallback HTML si la API no devolvió el torneo
        html = fetch_html(url)
        if not html:
            return None

        html_lower = html.lower()
        poster_url = None
        poster_matches = re.findall(r'https://res\.cloudinary\.com/playtomic/image/upload/[^\s"\'<>]+\.(?:jpg|jpeg|png|webp)', html)
        if poster_matches:
            p_candidates = [p for p in poster_matches if f'poster_{tid_clean}' in p or 'tournaments' in p]
            poster_url = p_candidates[0] if p_candidates else poster_matches[0]
        if not poster_url:
            poster_url = "img/padel-event.jpg"

        name = "AMERICANA PLAYTOMIC"
        m_name = re.search(r'"alt":"([^"]+)","src":"https://res\.cloudinary\.com/playtomic', html)
        if not m_name:
            m_name = re.search(r'<h1[^>]*>([^<]+)</h1>', html)
        if m_name:
            name = m_name.group(1).strip()

        name_lower = name.lower()
        m_tenant = re.search(r'data-tracking-property-tenant-name="([^"]+)"', html)
        tenant_name = m_tenant.group(1).strip() if m_tenant else ""
        m_tenant_id = re.search(r'data-tracking-property-tenant-id="([^"]+)"', html)
        tenant_id = m_tenant_id.group(1).strip() if m_tenant_id else ""

        is_el_prat = (
            "prat" in tenant_name.lower() or
            "bainad" in html_lower or
            "eduard" in html_lower or
            "prat" in name_lower or
            "el prat" in html_lower or
            tenant_id == "da77c69a-43b3-11e8-8674-52540049669c"
        )

        if any(b in name_lower for b in external_brands):
            log(f"   ⛔ FILTRADO / DESCARTADO: '{name}' pertenece a una marca externa ajena a Somos Pádel.")
            return None

        if is_el_prat:
            sede = "Barcelona Pádel El Prat"
            organizer = "Eduard Bainad Puig"
            if not (tid_clean in configured_uuids or "somos" in name_lower):
                return None
        else:
            sede = "NEW Play Padel Pro Hospitalet"
            organizer = "somospadel barcelona"
            if not (tid_clean in configured_uuids or "somos" in name_lower or "americana" in name_lower):
                return None

        is_fixed_candidate = ("pareja fija" in html_lower or "halloween" in name_lower)
        is_fixed = is_fixed_candidate
        pair_mode = "fixed" if is_fixed else "twister"
        format_type = "fixed" if is_fixed else "twister"
        category = "femenina" if "femenin" in name_lower else "open"
        date_str, time_str, time_end_str = extract_playtomic_datetime(html)
        spots_left = 20
        total_spots = 20
        m_spots = re.search(r'(\d+)\s*(?:de|of)\s*(\d+)\s*(?:plazas|spots)', html, re.I)
        if m_spots:
            spots_left = int(m_spots.group(1))
            total_spots = int(m_spots.group(2))
            occupied_spots = max(0, total_spots - spots_left)
        else:
            occupied_spots = 0
        courts_count = max(2, int(total_spots / 4))
        price_val = "12"
        api_status = "PENDING"

    # Doc ID coherente
    if tid_clean == "46011a01-68b4-433f-b2e3-581ca5fabfdb" or "halloween" in name_lower:
        date_str = "2026-10-31"
    if tid_clean == "46011a01-68b4-433f-b2e3-581ca5fabfdb":
        doc_id = "pt_46011a01_halloween"
    elif tid_clean == "f25003a4-105e-440d-a0ed-930bf047bd94":
        doc_id = "HWAnrOcyb85pT0eklDnc"
    else:
        doc_id = f"pt_{tid_clean[:8]}"

    # 8. Extraer JUGADORES REALES de Playtomic de forma 100% autónoma
    now_iso = datetime.now(timezone.utc).isoformat()
    real_players, fixed_pairs, detected_fixed = fetch_playtomic_real_players(
        tid_clean, sede, organizer, force_fixed=is_fixed_candidate, api_data=api_data
    )
    
    if detected_fixed or is_fixed_candidate:
        is_fixed = True
        pair_mode = "fixed"
        format_type = "fixed"
    
    if real_players:
        players_list = real_players
        occupied_spots = len(real_players)
        spots_left = max(0, total_spots - occupied_spots)
        log(f"   🌟 [PLAYTOMIC AUTÓNOMO] {len(real_players)} jugadores REALES extraídos con éxito ({len(fixed_pairs)} parejas configuradas)")
    else:
        players_list = []
        for i in range(1, occupied_spots + 1):
            players_list.append({
                "id": f"pt_playtomic_{tid_clean[:8]}_{i}",
                "name": f"Plaza Playtomic #{i}",
                "display_name": f"Plaza Playtomic #{i}",
                "level": 3.5,
                "position": "Drive" if i % 2 != 0 else "Revés",
                "source": "playtomic",
                "is_external": True,
                "is_playtomic": True,
                "playtomic_status": "confirmed",
                "price_paid": float(price_val),
                "club": sede,
                "organizer": organizer,
                "joinedAt": now_iso
            })

    urgency_tag = f"¡ÚLTIMAS {spots_left} PLAZAS LIBRES!" if 0 < spots_left <= 4 else f"{occupied_spots}/{total_spots} Plazas"
    desc_mode = "👥 Sistema Pareja Fija (juegas con tu pareja)" if is_fixed else "🌪️ Sistema Twister individual (rotación por ronda, NO pareja fija)"
    today_str = datetime.now().strftime("%Y-%m-%d")
    is_finished = (api_status == "PLAYED") or (date_str < today_str)

    tournament_data = {
        "doc_id": doc_id,
        "playtomic_id": tid_clean,
        "name": name,
        "location": sede,
        "sede": sede,
        "date": date_str,
        "normDate": date_str,
        "time": time_str,
        "time_end": time_end_str,
        "duration": "2h",
        "pair_mode": pair_mode,
        "format": format_type,
        "category": category,
        "level_min": "0",
        "level_max": "7",
        "price": price_val,
        "price_member": price_val,
        "price_external": price_val,
        "max_players": total_spots,
        "maxPlayers": total_spots,
        "occupied_players": occupied_spots,
        "spots_left": spots_left,
        "courts": courts_count,
        "max_courts": courts_count,
        "image_url": poster_url,
        "playtomicUrl": full_share_url,
        "playtomic_url": full_share_url,
        "status": ("finished" if is_finished else "open"),
        "is_external": True,
        "is_private": False,
        "organizer": organizer,
        "description": f"🎾 {name}\n📍 {sede}\n👤 Organizador: {organizer}\n📲 Inscripción oficial directa por Playtomic\n{desc_mode}\n⏱️ {time_str} - {time_end_str} h ({courts_count} Pistas)\n⚡ {occupied_spots} de {total_spots} plazas ocupadas ({urgency_tag})\n💶 Precio oficial: {price_val} €",
        "fixed_pairs": fixed_pairs if is_fixed else [],
        "fixedPairs": fixed_pairs if is_fixed else [],
        "players": players_list,
        "registeredPlayers": players_list,
        "updatedAt": now_iso
    }

    return tournament_data

def sync_to_firestore(t_data):
    """Sube o actualiza el documento del torneo en Firestore (colección americanas)."""
    doc_id = t_data["doc_id"]
    url = f"{FIRESTORE_BASE}/{doc_id}"

    players_raw = []
    for p in t_data.get("players", []):
        p_fields = {
            "id": {"stringValue": p["id"]},
            "name": {"stringValue": p["name"]},
            "display_name": {"stringValue": p.get("display_name", p["name"])},
            "level": {"doubleValue": float(p.get("level", 3.5))},
            "position": {"stringValue": p.get("position", "Drive")},
            "photoURL": {"stringValue": str(p.get("photoURL") or "")},
            "photo_url": {"stringValue": str(p.get("photo_url") or "")},
            "pair_id": {"stringValue": str(p.get("pair_id") or "")},
            "partner_name": {"stringValue": str(p.get("partner_name") or "")},
            "partner_id": {"stringValue": str(p.get("partner_id") or "")},
            "court": {"integerValue": str(p.get("court", 1))},
            "source": {"stringValue": "playtomic"},
            "is_playtomic": {"booleanValue": True},
            "playtomic_status": {"stringValue": "confirmed"},
            "price_paid": {"doubleValue": float(p.get("price_paid", 12.48))},
            "club": {"stringValue": p.get("club", t_data["location"])},
            "organizer": {"stringValue": p.get("organizer", t_data["organizer"])}
        }
        players_raw.append({"mapValue": {"fields": p_fields}})

    fixed_pairs_raw = []
    for fp in t_data.get("fixed_pairs", []):
        fp_fields = {
            "id": {"stringValue": str(fp.get("id", ""))},
            "pair_name": {"stringValue": str(fp.get("pair_name", ""))},
            "player1_id": {"stringValue": str(fp.get("player1_id", ""))},
            "player1_name": {"stringValue": str(fp.get("player1_name", ""))},
            "player1_photo": {"stringValue": str(fp.get("player1_photo", ""))},
            "player1_level": {"doubleValue": float(fp.get("player1_level", 0.0))},
            "player2_id": {"stringValue": str(fp.get("player2_id", ""))},
            "player2_name": {"stringValue": str(fp.get("player2_name", ""))},
            "player2_photo": {"stringValue": str(fp.get("player2_photo", ""))},
            "player2_level": {"doubleValue": float(fp.get("player2_level", 0.0))},
            "avg_level": {"doubleValue": float(fp.get("avg_level", 0.0))},
            "current_court": {"integerValue": str(fp.get("current_court", 1))},
            "initial_court": {"integerValue": str(fp.get("initial_court", 1))},
            "court": {"integerValue": str(fp.get("current_court", 1))},
            "wins": {"integerValue": str(fp.get("wins", 0))},
            "losses": {"integerValue": str(fp.get("losses", 0))},
            "games_won": {"integerValue": str(fp.get("games_won", 0))},
            "games_lost": {"integerValue": str(fp.get("games_lost", 0))},
            "points": {"integerValue": str(fp.get("points", 0))},
            "is_official_playtomic": {"booleanValue": bool(fp.get("is_official_playtomic", True))}
        }
        fixed_pairs_raw.append({"mapValue": {"fields": fp_fields}})

    fields = {
        "name": {"stringValue": t_data["name"]},
        "location": {"stringValue": t_data["location"]},
        "sede": {"stringValue": t_data["sede"]},
        "date": {"stringValue": t_data["date"]},
        "normDate": {"stringValue": t_data["date"]},
        "time": {"stringValue": t_data["time"]},
        "time_end": {"stringValue": t_data["time_end"]},
        "duration": {"stringValue": t_data["duration"]},
        "pair_mode": {"stringValue": t_data["pair_mode"]},
        "format": {"stringValue": t_data["format"]},
        "category": {"stringValue": str(t_data.get("category", "open"))},
        "fixed_pairs": {"arrayValue": {"values": fixed_pairs_raw}},
        "fixedPairs": {"arrayValue": {"values": fixed_pairs_raw}},
        "price": {"stringValue": str(t_data["price"])},
        "price_members": {"stringValue": str(t_data["price_member"])},
        "price_external": {"stringValue": str(t_data["price_external"])},
        "max_players": {"integerValue": str(t_data["max_players"])},
        "occupied_players": {"integerValue": str(t_data["occupied_players"])},
        "spots_left": {"integerValue": str(t_data["spots_left"])},
        "max_courts": {"integerValue": str(t_data["courts"])},
        "courts": {"integerValue": str(t_data["courts"])},
        "image_url": {"stringValue": t_data["image_url"]},
        "playtomic_id": {"stringValue": t_data["playtomic_id"]},
        "playtomicUrl": {"stringValue": t_data["playtomicUrl"]},
        "playtomic_url": {"stringValue": t_data["playtomic_url"]},
        "status": {"stringValue": t_data["status"]},
        "is_external": {"booleanValue": True},
        "organizer": {"stringValue": t_data["organizer"]},
        "description": {"stringValue": t_data["description"]},
        "players": {"arrayValue": {"values": players_raw}},
        "registeredPlayers": {"arrayValue": {"values": players_raw}},
        "has_freed_spot": {"booleanValue": bool(t_data.get("has_freed_spot", False))},
        "freed_spots_count": {"integerValue": str(t_data.get("freed_spots_count", 0))},
        "last_freed_spot_at": {"stringValue": str(t_data.get("last_freed_spot_at", ""))}
    }

    req_data = json.dumps({"fields": fields}).encode('utf-8')
    req = urllib.request.Request(
        f"{url}?key={FIREBASE_API_KEY}&updateMask.fieldPaths=name&updateMask.fieldPaths=location&updateMask.fieldPaths=sede&updateMask.fieldPaths=date&updateMask.fieldPaths=normDate&updateMask.fieldPaths=time&updateMask.fieldPaths=time_end&updateMask.fieldPaths=duration&updateMask.fieldPaths=pair_mode&updateMask.fieldPaths=format&updateMask.fieldPaths=price&updateMask.fieldPaths=price_members&updateMask.fieldPaths=price_external&updateMask.fieldPaths=max_players&updateMask.fieldPaths=occupied_players&updateMask.fieldPaths=spots_left&updateMask.fieldPaths=max_courts&updateMask.fieldPaths=courts&updateMask.fieldPaths=image_url&updateMask.fieldPaths=playtomic_id&updateMask.fieldPaths=playtomicUrl&updateMask.fieldPaths=playtomic_url&updateMask.fieldPaths=status&updateMask.fieldPaths=is_external&updateMask.fieldPaths=organizer&updateMask.fieldPaths=description&updateMask.fieldPaths=players&updateMask.fieldPaths=registeredPlayers&updateMask.fieldPaths=has_freed_spot&updateMask.fieldPaths=freed_spots_count&updateMask.fieldPaths=last_freed_spot_at&updateMask.fieldPaths=category&updateMask.fieldPaths=fixed_pairs&updateMask.fieldPaths=fixedPairs",
        data=req_data,
        headers={"Content-Type": "application/json"},
        method="PATCH"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            log(f"   [FIRESTORE] ✅ Documento '{doc_id}' replicado con éxito en vivo.")
            return True
    except urllib.error.HTTPError as e:
        if e.code == 404:
            # Crear documento nuevo si no existía
            create_url = f"{FIRESTORE_BASE}?documentId={doc_id}&key={FIREBASE_API_KEY}"
            create_req = urllib.request.Request(create_url, data=req_data, headers={"Content-Type": "application/json"}, method="POST")
            try:
                with urllib.request.urlopen(create_req, timeout=10) as c_resp:
                    log(f"   [FIRESTORE] 🌟 Nuevo documento '{doc_id}' creado con éxito.")
                    return True
            except Exception as e_create:
                log(f"   [FIRESTORE] ⚠️ No se pudo crear nuevo doc: {e_create}")
        else:
            log(f"   [FIRESTORE] ⚠️ Status {e.code}: {e.reason}")
        return False
    except Exception as e:
        log(f"   [FIRESTORE] ⚠️ Error: {e}")
        return False

def remember_tournament_uuid(uuid_str):
    """Guarda un nuevo UUID de torneo verificado en URLS_FILE si no está ya presente."""
    configured = [u.lower() for u in get_configured_uuids()]
    clean_uuid = str(uuid_str).strip().lower()
    if clean_uuid and clean_uuid not in configured:
        try:
            with open(URLS_FILE, "a", encoding="utf-8") as f:
                f.write(f"\nhttps://app.playtomic.com/tournaments/{clean_uuid}?utm_source=app_android&utm_campaign=share\n")
            log(f"   💾 [NUEVA AMERICANA REGISTRADA] Enlace guardado en {URLS_FILE}: {clean_uuid}")
        except Exception as e:
            log(f"   ⚠️ Error guardando UUID en {URLS_FILE}: {e}")

def run_sync_cycle(deep_discovery=True):
    """Ejecuta una ronda de análisis y sincronización Playtomic en tiempo real."""
    mode_str = "COMPLETO (+ búsqueda de nuevos torneos)" if deep_discovery else "RÁPIDO EN TIEMPO REAL"
    log("==================================================================")
    log(f"🚀 SINCRONIZACIÓN PLAYTOMIC [MODO {mode_str}]")
    log("==================================================================")
    
    uuids = get_all_target_uuids(deep_discovery=deep_discovery)
    log(f"📋 Torneos a sincronizar: {len(uuids)}")

    # Cargar histórico previo para detectar cancelaciones/bajas en vivo
    prev_map = {}
    if os.path.exists(OUTPUT_JSON):
        try:
            with open(OUTPUT_JSON, "r", encoding="utf-8") as f_prev:
                for item in json.load(f_prev):
                    prev_map[item.get("playtomic_id")] = item
        except Exception:
            pass

    results = []
    for uid in uuids:
        t_data = parse_playtomic_tournament(uid)
        if t_data:
            # Detección inteligente de bajas / plazas liberadas
            prev_t = prev_map.get(uid)
            if prev_t:
                prev_occ = prev_t.get("occupied_players", 0)
                curr_occ = t_data.get("occupied_players", 0)
                if curr_occ < prev_occ:
                    freed = prev_occ - curr_occ
                    log(f"   🚨 [BAT-SIGNAL ALERTA BAJA] ¡Se ha liberado {freed} plaza(s) en {t_data['name']}! (De {prev_occ} a {curr_occ} ocupadas)")
                    t_data["has_freed_spot"] = True
                    t_data["freed_spots_count"] = freed
                    t_data["last_freed_spot_at"] = datetime.now(timezone.utc).isoformat()
                elif curr_occ >= t_data.get("max_players", 20):
                    t_data["has_freed_spot"] = False
                    t_data["freed_spots_count"] = 0
            
            log(f"   🎾 {t_data['name']} [{t_data['location']}]: {t_data['occupied_players']}/{t_data['max_players']} plazas ({t_data['spots_left']} libres) • {t_data['courts']} pistas")
            sync_to_firestore(t_data)
            remember_tournament_uuid(uid)
            results.append(t_data)
        else:
            log(f"   ⚠️ Torneo {uid} descartado o no accesible")

    # Guardar snapshot completo en scraper/playtomic_extracted.json
    if results:
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        log(f"💾 Snapshot actualizado en {OUTPUT_JSON} ({len(results)} torneos)")

    log("==================================================================")
    log("✅ CICLO DE SINCRONIZACIÓN COMPLETADO")
    log("==================================================================")
    return results

def main():
    parser = argparse.ArgumentParser(description="Automatismo Playtomic Somos Pádel")
    parser.add_argument("--once", action="store_true", help="Ejecutar una sola vez y salir")
    parser.add_argument("--daily", action="store_true", help="Modo autónomo diario: ejecuta un ciclo cada 24h")
    parser.add_argument("--interval-hours", type=float, default=None, help="Intervalo en horas")
    parser.add_argument("--interval-minutes", type=float, default=2.0, help="Intervalo en minutos (por defecto 2 min)")
    args = parser.parse_args()

    if args.once:
        run_sync_cycle(deep_discovery=True)
        sys.exit(0)

    if args.daily:
        sleep_secs = 24 * 3600
        desc = "24 horas (DIARIO AUTÓNOMO)"
    elif args.interval_hours is not None:
        sleep_secs = int(args.interval_hours * 3600)
        desc = f"{args.interval_hours} horas"
    else:
        sleep_secs = int(args.interval_minutes * 60)
        desc = f"{args.interval_minutes} minutos"

    log(f"🔄 Modo Daemon Tiempo Real ACTIVO. Intervalo de actualización: cada {desc}.")
    cycle_count = 0
    while True:
        try:
            deep = (cycle_count % 30 == 0)
            run_sync_cycle(deep_discovery=True)
            cycle_count += 1
        except Exception as e:
            log(f"❌ Error en ciclo daemon: {e}")
        
        log(f"💤 Siguiente comprobación en vivo en {sleep_secs}s ({desc})...")
        time.sleep(sleep_secs)

if __name__ == "__main__":
    main()
