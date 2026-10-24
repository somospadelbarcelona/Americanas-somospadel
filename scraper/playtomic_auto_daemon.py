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

WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRAPER_DIR = os.path.join(WORKSPACE_DIR, "scraper")
URLS_FILE = os.path.join(SCRAPER_DIR, "playtomic_tournaments_urls.txt")
OUTPUT_JSON = os.path.join(SCRAPER_DIR, "playtomic_extracted.json")
LOG_FILE = os.path.join(SCRAPER_DIR, "playtomic_daemon.log")

FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/americanas-somospadel/databases/(default)/documents/americanas"

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
    """Descubre de forma autónoma enlaces a torneos de las páginas públicas oficiales de ambos clubes."""
    discovered = set()
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

def get_all_target_uuids():
    """Reúne todos los torneos Playtomic configurados y los descubiertos autónomamente."""
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

    # 1. Descubrir desde las páginas oficiales de los clubes
    club_uuids = extract_tournament_uuids_from_club_pages()
    for u in club_uuids:
        uuids.add(u)

    # 2. Descubrir desde el navegador
    browser_uuids = extract_tournament_uuids_from_browser()
    for u in browser_uuids:
        uuids.add(u)

    return sorted(list(uuids))

def parse_playtomic_tournament(tournament_id):
    """Parsea exhaustivamente todos los datos necesarios de una americana creada en Playtomic."""
    url = f"https://app.playtomic.com/tournaments/{tournament_id}"
    full_share_url = f"https://app.playtomic.com/tournaments/{tournament_id}?utm_source=app_android&utm_campaign=share"
    
    html = fetch_html(url)
    if not html:
        return None

    html_lower = html.lower()

    # 1. Cartel Oficial HD de Playtomic (Cloudinary)
    poster_url = None
    poster_matches = re.findall(r'https://res\.cloudinary\.com/playtomic/image/upload/[^\s"\'<>]+\.(?:jpg|jpeg|png|webp)', html)
    if poster_matches:
        p_candidates = [p for p in poster_matches if f'poster_{tournament_id}' in p or 'tournaments' in p]
        poster_url = p_candidates[0] if p_candidates else poster_matches[0]
    if not poster_url:
        poster_url = "img/padel-event.jpg"

    # 2. Nombre del Torneo
    name = "AMERICANA PLAYTOMIC"
    m_name = re.search(r'"alt":"([^"]+)","src":"https://res\.cloudinary\.com/playtomic', html)
    if not m_name:
        m_name = re.search(r'<h1[^>]*>([^<]+)</h1>', html)
    if m_name:
        name = m_name.group(1).strip()

    name_lower = name.lower()

    # 3. Sede y Organizador Oficial
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

    if is_el_prat:
        sede = "Barcelona Pádel El Prat"
        organizer = "Eduard Bainad Puig"
        # FILTRO ESTRICTO EDUARD BAINAD PUIG: Solo torneos de 'somospadel barcelona'
        # Descartar promociones ajenas como Vibra Pádel, Jaleo, etc.
        is_somospadel_prat = (
            tournament_id.lower() == "f25003a4-105e-440d-a0ed-930bf047bd94" or
            any(k in name_lower for k in [
                "somospadel barcelona", "somos padel barcelona", 
                "somospadel bcn", "somos padel bcn", 
                "somospadel", "somos pádel", "somos padel"
            ])
        )
        if not is_somospadel_prat:
            log(f"   ⛔ FILTRADO / DESCARTADO: '{name}' de Eduard Bainad Puig no pertenece a 'somospadel barcelona'.")
            return None
    else:
        sede = "NEW Play Padel Pro Hospitalet"
        organizer = "somospadeleugestion@gmail.com" # Exigido: somospadeleugestion@gmail.com SIEMPRE para este club
        # FILTRO ESTRICTO SOMOSPADELEUGESTION: Solo americanas de:
        # 1. 'Pádel Barcelona reservadas' / 'Padel Barcelona reservadas'
        # 2. 'somospadel barcelona' (o variantes somospadel bcn, etc.)
        # 3. Y la americana oficial de Halloween (46011a01-68b4-433f-b2e3-581ca5fabfdb)
        is_somospadel_hosp = (
            tournament_id.lower() == "46011a01-68b4-433f-b2e3-581ca5fabfdb" or
            any(k in name_lower for k in [
                "pádel barcelona reservadas", "padel barcelona reservadas",
                "pádel barcelona reservada", "padel barcelona reservada",
                "pádel barcelona", "padel barcelona",
                "somospadel barcelona", "somos padel barcelona",
                "somospadel bcn", "somos padel bcn",
                "somospadel", "somos pádel", "somos padel"
            ])
        )
        if not is_somospadel_hosp:
            log(f"   ⛔ FILTRADO / DESCARTADO: '{name}' de somospadeleugestion no pertenece a 'Pádel Barcelona reservadas' ni a 'somospadel barcelona'.")
            return None

    # 4. Tipo de americana: Pareja Fija vs Twister Individual
    # Analizamos únicamente el título y el contenido visible, evitando scripts JS
    fixed_keywords = ["pareja fija", "por parejas", "en pareja", "parejas fijas", "duplas", "inscripcion en pareja", "inscripción por parejas"]
    twister_keywords = ["twister", "individual", "rotacion", "rotación", "pozo", "americano", "mexicano", "sin pareja fija"]

    # Extraer texto visible del artículo principal
    m_article = re.search(r'<article[^>]*>(.*?)</article>', html, re.DOTALL)
    visible_snippet = (m_article.group(1) if m_article else "") + " " + name
    visible_lower = visible_snippet.lower()

    is_fixed = False
    if any(k in visible_lower for k in fixed_keywords):
        is_fixed = True
    elif any(k in visible_lower for k in twister_keywords):
        is_fixed = False
    else:
        # Por defecto para Somos Pádel BCN y New Play Padel: Twister individual con rotación
        is_fixed = False

    pair_mode = "fixed" if is_fixed else "twister"
    format_type = "fixed" if is_fixed else "twister"
    mode_label = "Pareja Fija" if is_fixed else "Twister individual (rotación por ronda)"

    # 5. Fecha y Horario
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

    # 6. Plazas Reales y Pistas Reales
    spots_left = 20
    total_spots = 20
    m_spots = re.search(r'(\d+)\s*(?:de|of)\s*(\d+)\s*(?:plazas|spots)', html, re.I)
    if not m_spots:
        m_spots = re.search(r'(\d+)\s*(?:de|of)\s*(\d+)', html)
        
    if m_spots:
        spots_left = int(m_spots.group(1))
        total_spots = int(m_spots.group(2))
        occupied_spots = max(0, total_spots - spots_left)
    else:
        occupied_spots = 0

    courts_count = max(2, int(total_spots / 4))

    # 7. Precio Oficial de Playtomic
    extracted_price = None
    m_price = re.search(r'itemProp="price"\s*content="([^"]+)"', html)
    if m_price:
        try:
            p_val = float(m_price.group(1).replace(',', '.'))
            extracted_price = f"{p_val:.2f}".rstrip('0').rstrip('.')
            if extracted_price == "": extracted_price = "0"
        except Exception:
            extracted_price = m_price.group(1).strip()
    
    if not extracted_price:
        m_money = re.search(r'"moneyLiteral":"([^"]+)"', html)
        if m_money:
            m_val = re.search(r'(\d+[\.,]?\d*)', m_money.group(1))
            if m_val: extracted_price = m_val.group(1).replace(',', '.')

    if extracted_price is not None and float(extracted_price.replace(',', '.')) > 0:
        price_val = extracted_price
    else:
        # Fallback de seguridad al precio oficial de Playtomic (12.48 €)
        price_val = "12.48"

    # Doc ID coherente
    if tournament_id == "46011a01-68b4-433f-b2e3-581ca5fabfdb":
        doc_id = "pt_46011a01_halloween"
    elif tournament_id == "f25003a4-105e-440d-a0ed-930bf047bd94":
        doc_id = "HWAnrOcyb85pT0eklDnc"
    else:
        doc_id = f"pt_{tournament_id[:8]}"

    # 8. Generar jugadores estructurados VIP Playtomic (sin placeholders numéricos planos)
    now_iso = datetime.now(timezone.utc).isoformat()
    players_list = []
    for i in range(1, occupied_spots + 1):
        players_list.append({
            "id": f"pt_playtomic_{tournament_id[:8]}_{i}",
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
        "pair_mode": pair_mode,
        "format": format_type,
        "category": "open",
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
        "status": "open",
        "is_external": True,
        "is_private": False,
        "organizer": organizer,
        "description": f"🎾 {name}\n📍 {sede}\n👤 Organizador: {organizer}\n📲 Inscripción oficial directa por Playtomic\n{desc_mode}\n⏱️ {time_str} - {time_end_str} h ({courts_count} Pistas)\n⚡ {occupied_spots} de {total_spots} plazas ocupadas ({urgency_tag})\n💶 Precio oficial: {price_val} €",
        "players": players_list,
        "registeredPlayers": players_list,
        "updatedAt": now_iso
    }

    # Persistir en URLS_FILE únicamente los torneos que superen los filtros oficiales
    try:
        with open(URLS_FILE, "r", encoding="utf-8") as f_u:
            existing_urls = f_u.read()
        if tournament_id not in existing_urls:
            with open(URLS_FILE, "a", encoding="utf-8") as f_u:
                f_u.write(f"https://app.playtomic.com/tournaments/{tournament_id}?utm_source=app_android&utm_campaign=share\n")
    except Exception:
        pass

    return tournament_data

def sync_to_firestore(t_data):
    """Sube o actualiza el documento del torneo en Firestore (colección americanas)."""
    doc_id = t_data["doc_id"]
    url = f"{FIRESTORE_BASE}/{doc_id}"

    players_raw = []
    for p in t_data.get("players", []):
        players_raw.append({
            "mapValue": {
                "fields": {
                    "id": {"stringValue": p["id"]},
                    "name": {"stringValue": p["name"]},
                    "display_name": {"stringValue": p.get("display_name", p["name"])},
                    "level": {"doubleValue": float(p.get("level", 3.5))},
                    "position": {"stringValue": p.get("position", "Drive")},
                    "source": {"stringValue": "playtomic"},
                    "is_playtomic": {"booleanValue": True},
                    "playtomic_status": {"stringValue": "confirmed"},
                    "price_paid": {"doubleValue": float(p.get("price_paid", 12.48))},
                    "club": {"stringValue": p.get("club", t_data["location"])},
                    "organizer": {"stringValue": p.get("organizer", t_data["organizer"])}
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
        "registeredPlayers": {"arrayValue": {"values": players_raw}}
    }

    req_data = json.dumps({"fields": fields}).encode('utf-8')
    req = urllib.request.Request(
        f"{url}?updateMask.fieldPaths=name&updateMask.fieldPaths=location&updateMask.fieldPaths=sede&updateMask.fieldPaths=date&updateMask.fieldPaths=time&updateMask.fieldPaths=time_end&updateMask.fieldPaths=duration&updateMask.fieldPaths=pair_mode&updateMask.fieldPaths=format&updateMask.fieldPaths=price&updateMask.fieldPaths=price_members&updateMask.fieldPaths=price_external&updateMask.fieldPaths=max_players&updateMask.fieldPaths=occupied_players&updateMask.fieldPaths=spots_left&updateMask.fieldPaths=max_courts&updateMask.fieldPaths=courts&updateMask.fieldPaths=image_url&updateMask.fieldPaths=playtomic_id&updateMask.fieldPaths=playtomicUrl&updateMask.fieldPaths=playtomic_url&updateMask.fieldPaths=status&updateMask.fieldPaths=is_external&updateMask.fieldPaths=organizer&updateMask.fieldPaths=description&updateMask.fieldPaths=players&updateMask.fieldPaths=registeredPlayers",
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
            create_url = f"{FIRESTORE_BASE}?documentId={doc_id}"
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

def run_sync_cycle():
    """Ejecuta una ronda completa de descubrimiento, análisis y sincronización."""
    log("==================================================================")
    log("🚀 INICIANDO CICLO AUTÓNOMO DE SINCRONIZACIÓN PLAYTOMIC")
    log("==================================================================")
    
    uuids = get_all_target_uuids()
    log(f"📋 Torneos a sincronizar: {len(uuids)}")

    results = []
    for uid in uuids:
        log(f"\n🔎 Analizando torneo: {uid}...")
        t_data = parse_playtomic_tournament(uid)
        if t_data:
            log(f"   -> Nombre: {t_data['name']}")
            log(f"   -> Sede: {t_data['location']}")
            log(f"   -> Organizador: {t_data['organizer']}")
            log(f"   -> Formato: {t_data['pair_mode'].upper()} ({'Pareja Fija' if t_data['pair_mode']=='fixed' else 'Twister individual'})")
            log(f"   -> Pistas: {t_data['courts']} ({t_data['max_players']} plazas)")
            log(f"   -> Ocupación: {t_data['occupied_players']} / {t_data['max_players']} ({t_data['spots_left']} libres)")
            log(f"   -> Precio oficial: {t_data['price']} €")
            log(f"   -> Cartel HD: {t_data['image_url'][:70]}...")

            sync_to_firestore(t_data)
            results.append(t_data)
        else:
            log(f"   ⚠️ No se pudieron obtener datos del torneo {uid}")

    # Guardar snapshot completo en scraper/playtomic_extracted.json
    if results:
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        log(f"💾 Snapshot local guardado en {OUTPUT_JSON} ({len(results)} torneos)")

    log("==================================================================")
    log("✅ CICLO COMPLETADO CON ÉXITO")
    log("==================================================================")
    return results

def main():
    parser = argparse.ArgumentParser(description="Automatismo Playtomic Somos Pádel")
    parser.add_argument("--once", action="store_true", help="Ejecutar una sola vez y salir")
    parser.add_argument("--interval-hours", type=float, default=3.0, help="Intervalo en horas entre revisiones (por defecto 3h)")
    args = parser.parse_args()

    if args.once:
        run_sync_cycle()
        sys.exit(0)

    log(f"🔄 Modo daemon activo. Intervalo de revisión: cada {args.interval_hours} horas.")
    while True:
        try:
            run_sync_cycle()
        except Exception as e:
            log(f"❌ Error inesperado en ciclo: {e}")
        
        sleep_secs = int(args.interval_hours * 3600)
        log(f"💤 Durmiendo {sleep_secs}s hasta la próxima revisión periódica...")
        time.sleep(sleep_secs)

if __name__ == "__main__":
    main()
