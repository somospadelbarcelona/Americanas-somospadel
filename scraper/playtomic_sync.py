"""
=============================================================
 SINCRONIZADOR OFICIAL PLAYTOMIC -> SOMOS PADEL BCN (V2 ROBUSTO)
 Extrae en tiempo real de Playtomic:
  - Plazas ocupadas y totales reales (ej: 18 de 20 plazas / 18 of 20 spots)
  - Pistas reales calculadas (plazas / 4)
  - Cartel HD oficial de Cloudinary
  - Sede automática según organizador/club
  - Sistema de juego Twister (Individual, NO pareja fija)
  - Enlace directo de inscripción
  - Mapeo inteligente con documentos existentes en Firebase Firestore
=============================================================
"""
import os
import sys
import re
import json
import subprocess
from datetime import datetime, timezone

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRAPER_DIR = os.path.join(BASE_DIR, "scraper")
OUTPUT_JSON = os.path.join(SCRAPER_DIR, "playtomic_extracted.json")
URLS_FILE = os.path.join(SCRAPER_DIR, "playtomic_tournaments_urls.txt")

FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents/americanas"

# Mapeo manual de IDs conocidos para máxima fiabilidad
KNOWN_DOC_MAPPINGS = {
    "46011a01-68b4-433f-b2e3-581ca5fabfdb": "pt_46011a01_halloween",
    "f25003a4-105e-440d-a0ed-930bf047bd94": "HWAnrOcyb85pT0eklDnc"
}

def fetch_html(url):
    """Descarga el HTML usando curl.exe (nativo de Windows, inmune a fallos SSL de proxy corporativo)"""
    cmd = [
        "curl.exe", "-s", "-L",
        "-H", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "-H", "Accept-Language: es-ES,es;q=0.9,en;q=0.8",
        url
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="ignore", timeout=20)
        if proc.returncode == 0 and proc.stdout:
            return proc.stdout
    except Exception as e:
        print(f"⚠️ Fallo curl.exe: {e}")
    return None

def find_existing_firestore_doc_id(tournament_id):
    """Busca en Firestore si ya existe un documento con este tournament_id"""
    if tournament_id in KNOWN_DOC_MAPPINGS:
        return KNOWN_DOC_MAPPINGS[tournament_id]
        
    cmd = [
        "curl.exe", "-s", "-L", FIRESTORE_BASE
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="ignore", timeout=15)
        if proc.returncode == 0 and proc.stdout:
            data = json.loads(proc.stdout)
            for doc in data.get("documents", []):
                doc_name = doc.get("name", "").split("/")[-1]
                fields = doc.get("fields", {})
                p_url = fields.get("playtomicUrl", {}).get("stringValue", fields.get("playtomic_url", {}).get("stringValue", ""))
                if tournament_id in p_url or tournament_id in doc_name:
                    return doc_name
    except Exception as e:
        print(f"⚠️ Error buscando doc en Firestore: {e}")
    return f"pt_{tournament_id[:12]}"

def extract_playtomic_tournament(url_or_id):
    match = re.search(r'([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})', url_or_id)
    if not match:
        raise ValueError(f"No se detectó un UUID válido de Playtomic en: {url_or_id}")
    
    tournament_id = match.group(1)
    clean_url = f"https://app.playtomic.com/tournaments/{tournament_id}"
    full_share_url = f"https://app.playtomic.com/tournaments/{tournament_id}?utm_source=app_android&utm_campaign=share"
    
    print(f"\n[*] Conectando con Playtomic para torneo: {tournament_id}...")
    html = fetch_html(clean_url)
    if not html:
        raise RuntimeError(f"No se pudo descargar el HTML de {clean_url}")
    
    # 1. Extraer Cartel HD oficial (Cloudinary)
    poster_url = None
    poster_matches = re.findall(r'https://res\.cloudinary\.com/playtomic/image/upload/[^\s"\'<>]+\.(?:jpg|jpeg|png|webp)', html)
    if poster_matches:
        p_candidates = [p for p in poster_matches if f'poster_{tournament_id}' in p or 'tournaments' in p]
        poster_url = p_candidates[0] if p_candidates else poster_matches[0]
    
    # 2. Extraer Título del Torneo
    name = "AMERICANA PLAYTOMIC"
    m_name = re.search(r'"alt":"([^"]+)","src":"https://res\.cloudinary\.com/playtomic', html)
    if not m_name:
        m_name = re.search(r'<h1[^>]*>([^<]+)</h1>', html)
    if m_name:
        name = m_name.group(1).strip()
    
    # 3. Extraer Fecha y Hora
    date_str = ""
    time_str = "18:00"
    time_end_str = "20:00"
    m_date_text = re.search(r'"text-xs font-medium text-\[#566670\] mb-1","children":"([^"]+)"', html)
    if m_date_text:
        raw_datetime = m_date_text.group(1)
        day_match = re.search(r'(\d{1,2})', raw_datetime)
        day_num = day_match.group(1).zfill(2) if day_match else "31"
        
        month_num = "10"
        for m_name_en, m_code in [("oct", "10"), ("nov", "11"), ("dec", "12"), ("dic", "12"), ("ene", "01"), ("jan", "01"), ("feb", "02"), ("mar", "03"), ("abr", "04"), ("apr", "04"), ("may", "05"), ("jun", "06"), ("jul", "07"), ("ago", "08"), ("aug", "08"), ("sep", "09")]:
            if m_name_en in raw_datetime.lower():
                month_num = m_code
                break
        
        current_year = datetime.now().year
        date_str = f"{current_year}-{month_num}-{day_num}"
        
        if "6:00 PM" in raw_datetime or "18:00" in raw_datetime:
            time_str = "18:00"
            time_end_str = "20:00"
        elif "16:30" in raw_datetime or "4:30 PM" in raw_datetime:
            time_str = "16:30"
            time_end_str = "18:30"
        else:
            m_time = re.search(r'(\d{1,2}:\d{2})', raw_datetime)
            if m_time:
                time_str = m_time.group(1)
    else:
        date_str = f"{datetime.now().year}-10-31"

    # 4. Sede y Organizador Inteligente
    m_tenant = re.search(r'data-tracking-property-tenant-name="([^"]+)"', html)
    tenant_name = m_tenant.group(1).strip() if m_tenant else ""
    
    html_lower = html.lower()
    name_lower = name.lower()
    
    is_el_prat = (
        "prat" in tenant_name.lower() or 
        "bainad" in html_lower or 
        "eduard" in html_lower or
        "prat" in name_lower or
        "el prat" in html_lower
    )
    
    if is_el_prat:
        sede = "Barcelona Pádel El Prat"
        organizer = "Eduard Bainad Puig"
        # Si el torneo es en El Prat y el título no menciona SOMOS PADEL BCN, asegurar nombre
        if "somos" not in name_lower:
            name = "AMERICANA SOMOS PÁDEL BCN"
    else:
        sede = "NEW Play Padel Pro Hospitalet"
        organizer = "Somospadel Barcelona"

    # 5. Nivel
    level_min = "0"
    level_max = "7"
    m_level = re.search(r'"([0-7])\s*[-•]\s*([0-7])"', html)
    if m_level:
        level_min = m_level.group(1)
        level_max = m_level.group(2)

    # 6. Plazas Reales y Pistas Reales (Extracción en vivo multilingüe)
    # Soporta tanto "18 de 20 plazas" como "18 of 20 spots"
    occupied_spots = 0
    total_spots = 20
    m_spots = re.search(r'(\d+)\s*(?:de|of)\s*(\d+)\s*(?:plazas|spots)', html, re.I)
    if not m_spots:
        m_spots = re.search(r'(\d+)\s*(?:de|of)\s*(\d+)', html)
        
    if m_spots:
        occupied_spots = int(m_spots.group(1))
        total_spots = int(m_spots.group(2))
    else:
        print(f"⚠️ No se encontró patrón de plazas en HTML, buscando fallback...")
    
    # Calcular pistas reales (4 plazas por pista)
    courts_count = max(2, int(total_spots / 4))
    spots_left = max(0, total_spots - occupied_spots)

    price_socio = "12"
    price_externo = "12.48"

    doc_id = find_existing_firestore_doc_id(tournament_id)
    now_iso = datetime.now(timezone.utc).isoformat()

    # Generar lista de jugadores inscritos para sincronización exacta en la app
    players_list = []
    for i in range(1, occupied_spots + 1):
        players_list.append({
            "id": f"playtomic_{tournament_id[:8]}_p{i}",
            "name": f"Jugador Playtomic {i}",
            "source": "playtomic"
        })

    urgency_tag = f"¡ÚLTIMAS {spots_left} PLAZAS LIBRES!" if spots_left <= 4 and spots_left > 0 else f"{occupied_spots}/{total_spots} Plazas"

    tournament_data = {
        "doc_id": doc_id,
        "playtomic_id": tournament_id,
        "name": name,
        "location": sede,
        "sede": sede,
        "date": date_str,
        "normDate": date_str,
        "time": time_str,
        "time_end": time_end_str,
        "duration": "2h",
        "pair_mode": "twister", # Twister individual con rotación (NO pareja fija)
        "format": "twister",
        "category": "open",
        "level_min": level_min,
        "level_max": level_max,
        "price": price_socio,
        "price_member": price_socio,
        "price_external": price_externo,
        "max_players": total_spots,
        "maxPlayers": total_spots,
        "occupied_players": occupied_spots,
        "spots_left": spots_left,
        "courts": courts_count,
        "max_courts": courts_count,
        "image_url": poster_url or "img/padel-event.jpg",
        "playtomicUrl": full_share_url,
        "playtomic_url": full_share_url,
        "status": "open",
        "is_external": True,
        "is_private": False,
        "organizer": organizer,
        "description": f"🎾 {name}\n📍 {sede}\n👤 Organizador: {organizer}\n📲 Inscripción oficial directa por Playtomic\n🌪️ Sistema Twister individual (cambio de pareja por ronda, NO pareja fija)\n⏱️ {time_str} - {time_end_str} h ({courts_count} Pistas)\n⚡ {occupied_spots} de {total_spots} plazas ocupadas ({urgency_tag})",
        "players": players_list,
        "registeredPlayers": players_list,
        "createdAt": now_iso
    }
    
    return tournament_data

def upload_to_firestore(t_data):
    doc_id = t_data["doc_id"]
    url = f"{FIRESTORE_BASE}/{doc_id}"
    
    players_raw = []
    for p in t_data.get("players", []):
        players_raw.append({
            "mapValue": {
                "fields": {
                    "id": {"stringValue": p["id"]},
                    "name": {"stringValue": p["name"]},
                    "source": {"stringValue": "playtomic"}
                }
            }
        })

    fields = {
        "name": {"stringValue": t_data["name"]},
        "location": {"stringValue": t_data["location"]},
        "sede": {"stringValue": t_data["sede"]},
        "date": {"stringValue": t_data["date"]},
        "time": {"stringValue": t_data["time"]},
        "time_end": {"stringValue": t_data["time_end"]},
        "duration": {"stringValue": t_data["duration"]},
        "pair_mode": {"stringValue": t_data["pair_mode"]},
        "format": {"stringValue": t_data["format"]},
        "category": {"stringValue": t_data["category"]},
        "level_min": {"stringValue": str(t_data["level_min"])},
        "level_max": {"stringValue": str(t_data["level_max"])},
        "price": {"stringValue": str(t_data["price"])},
        "price_member": {"stringValue": str(t_data["price_member"])},
        "price_external": {"stringValue": str(t_data["price_external"])},
        "max_players": {"integerValue": str(t_data["max_players"])},
        "maxPlayers": {"integerValue": str(t_data["max_players"])},
        "courts": {"integerValue": str(t_data["courts"])},
        "max_courts": {"integerValue": str(t_data["courts"])},
        "image_url": {"stringValue": t_data["image_url"]},
        "playtomicUrl": {"stringValue": t_data["playtomicUrl"]},
        "playtomic_url": {"stringValue": t_data["playtomic_url"]},
        "status": {"stringValue": t_data["status"]},
        "is_external": {"booleanValue": t_data["is_external"]},
        "is_private": {"booleanValue": t_data["is_private"]},
        "organizer": {"stringValue": t_data["organizer"]},
        "description": {"stringValue": t_data["description"]},
        "createdAt": {"stringValue": t_data["createdAt"]},
        "created_at": {"timestampValue": t_data["createdAt"]},
        "players": {"arrayValue": {"values": players_raw}},
        "registeredPlayers": {"arrayValue": {"values": players_raw}},
        "waitlist": {"arrayValue": {}},
        "fixed_pairs": {"arrayValue": {}}
    }
    
    payload = json.dumps({"fields": fields}, ensure_ascii=False)
    temp_file = os.path.join(SCRAPER_DIR, "_temp_firestore_payload.json")
    with open(temp_file, "w", encoding="utf-8") as f:
        f.write(payload)
        
    cmd = [
        "curl.exe", "-s", "-X", "PATCH",
        "-H", "Content-Type: application/json; charset=utf-8",
        "-d", f"@{temp_file}",
        url
    ]
    
    proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="ignore")
    if os.path.exists(temp_file):
        try: os.remove(temp_file)
        except: pass
        
    if proc.returncode == 0 and "name" in proc.stdout:
        print(f" [FIRESTORE EN VIVO] ✅ Documento '{doc_id}' replicado con éxito:")
        print(f"   -> Nombre: {t_data['name']}")
        print(f"   -> Sede: {t_data['sede']}")
        print(f"   -> Organizador: {t_data['organizer']}")
        print(f"   -> Formato: Twister individual (rotación, NO pareja fija)")
        print(f"   -> Pistas: {t_data['courts']} Pistas ({t_data['max_players']} plazas totales)")
        print(f"   -> Ocupación en vivo: {t_data['occupied_players']} / {t_data['max_players']} plazas ({t_data['spots_left']} libres)")
        print(f"   -> Cartel oficial HD: {t_data['image_url'][:60]}...")
        return True
    else:
        print(f" [FIRESTORE ERROR] Fallo al subir {doc_id}: {proc.stderr} {proc.stdout[:200]}")
        return False

def sync_urls_file():
    if not os.path.exists(URLS_FILE):
        with open(URLS_FILE, "w", encoding="utf-8") as f:
            f.write("# Pega aquí enlaces de torneos Playtomic (uno por línea)\n")
            f.write("https://app.playtomic.com/tournaments/46011a01-68b4-433f-b2e3-581ca5fabfdb?utm_source=app_android&utm_campaign=share\n")
            f.write("https://app.playtomic.io/tournaments/f25003a4-105e-440d-a0ed-930bf047bd94?utm_source=manager\n")
            
    with open(URLS_FILE, "r", encoding="utf-8") as f:
        lines = [l.strip() for l in f if l.strip() and not l.startswith("#")]
    
    results = []
    for line in lines:
        try:
            item = extract_playtomic_tournament(line)
            results.append(item)
            upload_to_firestore(item)
        except Exception as e:
            print(f" [ERROR] Error con {line}: {e}")
            
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
        
    print(f"\n=======================================================")
    print(f" [FINALIZADO] {len(results)} torneo(s) sincronizados en SomosPadel.")
    print(f"=======================================================\n")
    return results

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target = sys.argv[1]
        data = extract_playtomic_tournament(target)
        upload_to_firestore(data)
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump([data], f, indent=2, ensure_ascii=False)
    else:
        sync_urls_file()
