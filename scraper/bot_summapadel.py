"""
=============================================================
 BOT CAZARRECOMPENSAS v5 DIRECTO - SOMOS PADEL BCN
 Acceso directo a los 3 grupos oficiales (Velocidad Luz)
=============================================================
"""
import asyncio
import os
import json
import re
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(line_buffering=True)

TARGET_URL = "https://summapadel.com/event/151"
CLUB_KEYWORDS = ["somos", "padel bcn", "somopadel", "somospadel"]
OUTPUT_JS = os.path.join(os.getcwd(), "scraper", "teams_data_auto.js")
EXISTING_TEAMS_JS = os.path.join(os.getcwd(), "js", "modules", "teams", "teams_data.js")

# Los 3 equipos oficiales con sus grupos y divisiones exactos
TARGET_TEAMS = [
    {
        "slug": "somos-padel-bcn-3ma",
        "name": "SOMOS PÁDEL BCN 3MA",
        "div": "Tercera",
        "group": "3MB FASE 2 G3",
        "cat": "Masculina"
    },
    {
        "slug": "somos-padel-bcn-3m-b",
        "name": "SOMOS PÁDEL BCN 3MB",
        "div": "Tercera",
        "group": "3MA FASE 2 G5",
        "cat": "Masculina"
    },
    {
        "slug": "somos-padel-bcn-4m",
        "name": "SOMOS PÁDEL BCN 4M",
        "div": "Cuarta",
        "group": "4MA FASE 2 G4",
        "cat": "Masculina"
    },
    {
        "slug": "somos-padel-bcn-4xa",
        "name": "SOMOS PÁDEL BCN 4XA",
        "div": "Cuarta",
        "group": "4XB FASE 2 G1",
        "cat": "Mixta",
        "url": "https://summapadel.com/event/151"
    },
    {
        "slug": "somos-padel-bcn-4xb",
        "name": "SOMOS PÁDEL BCN 4XB",
        "div": "Cuarta",
        "group": "4XB FASE 2 G1",
        "cat": "Mixta",
        "url": "https://summapadel.com/event/151"
    },
    {
        "slug": "somos-padel-bcn-3xa",
        "name": "SOMOS PÁDEL BCN 3X",
        "div": "Tercera",
        "group": "3XB FASE 2 G3",
        "cat": "Mixta",
        "url": "https://summapadel.com/event/151"
    },
    {
        "slug": "somos-padel-bcn-4fa",
        "name": "SOMOS PÁDEL BCN 4FA",
        "div": "Cuarta",
        "group": "4FB FASE 2 G3",
        "cat": "Femenina",
        "url": "https://summapadel.com/event/151"
    },
    {
        "slug": "somos-padel-bcn-2f",
        "name": "SOMOS PÁDEL BCN 2F",
        "div": "Segunda",
        "group": "2FB FASE 2 G2",
        "cat": "Femenina",
        "url": "https://summapadel.com/event/151"
    }
]

found_teams = []
existing_teams = []

# Cargar fallbacks estáticos de equipos (roster y capitán oficiales)
if os.path.exists(EXISTING_TEAMS_JS):
    try:
        with open(EXISTING_TEAMS_JS, "r", encoding="utf-8") as f:
            js_content = f.read()
        
        json_match = re.search(r'window\.ClubTeamsData\s*=\s*(\[[\s\S]*?\])\s*;', js_content)
        if json_match:
            raw_json = json_match.group(1)
            raw_json = re.sub(r'([{,]\s*)([a-zA-Z0-9_]+)\s*:', r'\1"\2":', raw_json)
            raw_json = raw_json.replace("'", '"')
            raw_json = re.sub(r',\s*([\]}])', r'\1', raw_json)
            existing_teams = json.loads(raw_json)
            print(f"[FALLBACK] Cargados fallbacks de {len(existing_teams)} equipos de teams_data.js")
    except Exception as e:
        print(f"[AVISO] No se pudieron cargar los fallbacks estáticos: {e}")

def slug(name):
    return re.sub(r'[^a-z0-9]', '-', name.lower()).strip('-')

def contains_club(text):
    tl = text.lower()
    return any(kw in tl for kw in CLUB_KEYWORDS)

def clean_team_name(name):
    n = name.upper()
    n = n.replace("P?DEL", "PADEL").replace("PÁDEL", "PADEL").replace("PÀDEL", "PADEL").replace("PADELL", "PADEL")
    n = n.replace("Ó", "O").replace("Í", "I").replace("Ú", "U").replace("É", "E").replace("Á", "A")
    n = re.sub(r'[^A-Z0-9\s]', '', n)
    return " ".join(n.split())

def is_same_team(name1, name2):
    s1 = slug(clean_team_name(name1)).replace("-", "")
    s2 = slug(clean_team_name(name2)).replace("-", "")
    return s1 == s2

async def go_back_to_list(page):
    try:
        back_btn = page.locator(".mbsc-ic-arrow-left, .mbsc-ic-chevron-left, .mbsc-ic-arrow-back").first
        if await back_btn.is_visible():
            await back_btn.click()
            await page.wait_for_timeout(1000)
            return True
    except:
        pass
    try:
        await page.evaluate("""() => {
            let btn = document.querySelector('.mbsc-ic-arrow-left') || 
                      document.querySelector('.mbsc-ic-chevron-left') ||
                      Array.from(document.querySelectorAll('div, span, button')).find(e => e.innerText && (e.innerText.includes('Tornar') || e.innerText.includes('Volver')));
            if (btn) btn.click();
        }""")
        await page.wait_for_timeout(1000)
        return True
    except:
        pass
    return False

async def click_tab_robust(page, terms):
    for term in terms:
        try:
            handle = await page.evaluate_handle(f"""(term) => {{
                let elements = Array.from(document.querySelectorAll('li, button, a, label, .mbsc-segmented-item, .mbsc-scv-item, span, b, div'));
                let candidates = elements.filter(e => {{
                    let isVisible = e.offsetWidth > 0 || e.offsetHeight > 0 || e.getClientRects().length > 0;
                    return isVisible && e.innerText && e.innerText.trim().toLowerCase().includes(term.toLowerCase());
                }});
                if (candidates.length > 0) {{
                    candidates.sort((a, b) => a.innerText.trim().length - b.innerText.trim().length);
                    return candidates[0];
                }}
                return null;
            }}""", term)
            
            element = handle.as_element()
            if element:
                await element.click()
                await page.wait_for_timeout(1500)
                return True
        except Exception as e:
            print(f"Error click_tab_robust: {e}")
    return False

async def smooth_scroll_and_find(page, text_to_find, element_selector="*"):
    for _ in range(15):
        found = await page.evaluate(f"""(args) => {{
            let els = Array.from(document.querySelectorAll(args[1]));
            let candidates = els.filter(e => e.innerText && e.innerText.trim().includes(args[0]));
            if (candidates.length > 0) {{
                candidates.sort((a, b) => a.innerText.length - b.innerText.length);
                candidates[0].scrollIntoView({{behavior: 'smooth', block: 'center'}});
                return true;
            }}
            return false;
        }}""", [text_to_find, element_selector])
        
        if found:
            await page.wait_for_timeout(800)
            return True
        await page.mouse.wheel(0, 400)
        await page.wait_for_timeout(300)
    return False

async def click_element_by_text(page, text_to_find, element_selector="*"):
    success = await page.evaluate(f"""(args) => {{
        let els = Array.from(document.querySelectorAll(args[1]));
        let candidates = els.filter(e => e.innerText && e.innerText.trim().includes(args[0]));
        if (candidates.length > 0) {{
            candidates.sort((a, b) => a.innerText.length - b.innerText.length);
            candidates[0].click();
            return true;
        }}
        return false;
    }}""", [text_to_find, element_selector])
    return success

async def scrape_group(page, cat, division, group_name, team_slug, target_name):
    """Extrae clasificaciones, partidos y plantilla de forma robusta"""
    print(f"   Iniciando raspado del grupo {group_name}...")
    await page.wait_for_timeout(2000)
    
    # === 1. Partidos/Calendario (Pestaña 'Jornades' por defecto) ===
    schedule = []
    print("   Cargando todas las jornadas/partidos (scroll progresivo)...")
    
    last_item_count = 0
    for scroll_idx in range(12):
        match_els = await page.query_selector_all(".mbsc-lv-item")
        if len(match_els) == last_item_count and last_item_count > 0:
            break
        last_item_count = len(match_els)
        await page.mouse.wheel(0, 1500)
        await page.wait_for_timeout(350)

    match_els = await page.query_selector_all(".mbsc-lv-item")
    j_count = 1
    for row in match_els:
        try:
            if not await row.is_visible():
                continue
            row_text = (await row.inner_text()).strip()
            if not row_text:
                continue
                
            lines = [l.strip() for l in row_text.split("\n") if l.strip()]
            if len(lines) < 7:
                continue
                
            date = lines[0]
            round_str = lines[1]
            time_str = lines[2]
            venue = lines[3]
            status_str = lines[4]
            
            j_match = re.search(r'\d+', round_str)
            j_num = int(j_match.group()) if j_match else j_count
            
            if len(lines) >= 9 and lines[5].isdigit():
                score1 = lines[5]
                team1 = lines[6]
                score2 = lines[7]
                team2 = lines[8]
                is_completed = True
            elif len(lines) >= 7:
                score1 = ""
                team1 = lines[5]
                score2 = ""
                team2 = lines[6]
                is_completed = False
            else:
                continue
                
            is_team1_target = is_same_team(team1, target_name)
            is_team2_target = is_same_team(team2, target_name)
            
            if not is_team1_target and not is_team2_target:
                continue # Ignorar partidos que no correspondan a nuestro equipo exacto
                
            status_lower = status_str.lower()
            is_live_status = any(term in status_lower for term in ["iniciada", "joc", "juego", "progreso", "playing", "live"])
            
            opponent = "Por confirmar"
            score = "Pendiente"
            status = "upcoming"
            isHome = True
            
            if is_team1_target:
                opponent = team2
                isHome = True
                if is_completed:
                    if is_live_status:
                        score = f"{score1} - {score2} (en vivo)"
                        status = "live"
                    else:
                        score = f"{score1} - {score2}"
                        status = "completed"
                else:
                    if is_live_status:
                        score = "En juego"
                        status = "live"
            elif is_team2_target:
                opponent = team1
                isHome = False
                if is_completed:
                    if is_live_status:
                        score = f"{score2} - {score1} (en vivo)"
                        status = "live"
                    else:
                        score = f"{score2} - {score1}"
                        status = "completed"
                else:
                    if is_live_status:
                        score = "En juego"
                        status = "live"
                    
            opponent = " ".join(opponent.split()).upper()
            if not opponent or len(opponent) < 3:
                opponent = "RIVAL POR DEFINIR"
                
            schedule.append({
                "j": j_num,
                "date": date,
                "time": time_str,
                "opponent": opponent,
                "score": score,
                "venue": venue,
                "isHome": isHome,
                "status": status
            })
            j_count += 1
        except Exception as e:
            print(f"      [ERR] Error parseando fila de partido: {e}")

    schedule.sort(key=lambda x: x["j"])
    print(f"   Partidos raspados: {len(schedule)}")

    # === 2. Clasificación ===
    print("   Cambiando a pestana Classificacio...")
    await click_tab_robust(page, ["Classificació", "Classificación", "Classificacion", "Standing"])
    await page.wait_for_timeout(2000)
    
    standings = []
    rows = await page.query_selector_all(".mbsc-lv-item")
    print(f"   Procesando {len(rows)} filas en Clasificacion...")
    
    target_row_element = None
    team_name = f"SOMOS PÁDEL BCN ({group_name})"
    
    for row in rows:
        try:
            if not await row.is_visible():
                continue
            row_text = (await row.inner_text()).strip()
            lines = [l.strip() for l in row_text.split("\n") if l.strip()]
            if len(lines) < 3:
                continue
                
            stats_parts = lines[0].split()
            if len(stats_parts) >= 2:
                pj = int(re.search(r'\d+', stats_parts[0]).group())
                pts = int(re.search(r'\d+', stats_parts[1]).group())
            else:
                pj = 0
                pts = 0
                
            name_cell = lines[1]
            captain_cell = lines[2]
            
            # Limpieza y comparación robusta para evitar mezclar equipos mixtos (4XA y 4XB) del mismo grupo
            def clean_name(s):
                s = s.lower()
                s = s.replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
                s = re.sub(r'[^a-z0-9]', '', s)
                return s
            
            is_current = clean_name(target_name) in clean_name(name_cell) or clean_name(name_cell) in clean_name(target_name)
            if is_current:
                target_row_element = row
                team_name = name_cell
                
            pg = max(0, pts - pj)
            pp = max(0, pj - pg)
            
            standings.append({
                "pos": len(standings) + 1,
                "team": name_cell.upper(),
                "pj": pj,
                "pg": pg,
                "pp": pp,
                "df": 0,
                "pts": pts,
                **({"isCurrent": True} if is_current else {})
            })
        except Exception as e:
            pass

    print(f"   Clasificacion raspada: {len(standings)} equipos.")

    # === 3. Plantilla / Detalle de Equipo ===
    roster = []
    captain = "Pendiente"
    subcaptain = "Pendiente"
    
    # Cargar fallbacks estáticos por si acaso
    fallback_roster = []
    for et in existing_teams:
        if et.get("id") == team_slug:
            fallback_roster = et.get("roster", [])
            captain = et.get("captain", "Pendiente")
            break
            
    if target_row_element:
        print(f"   Equipo propio encontrado: '{team_name}'. Clicando para detalle...")
        try:
            await target_row_element.click()
            await page.wait_for_timeout(7500)
            
            team_page_text = await page.inner_text("body")
            lines = [l.strip() for l in team_page_text.split("\n") if l.strip()]
            
            for line in lines:
                if "capità:" in line.lower() or "capitan:" in line.lower():
                    captain = line.split(":", 1)[1].strip().title()
                elif "subcapità:" in line.lower() or "subcapitan:" in line.lower():
                    subcaptain = line.split(":", 1)[1].strip().title()
                    
            start_idx = -1
            for idx, line in enumerate(lines):
                if "llistat jugadors" in line.lower() or "llistat de jugadors" in line.lower():
                    start_idx = idx
                    break
            if start_idx == -1:
                for idx, line in enumerate(lines):
                    if "jugadors" in line.lower():
                        start_idx = idx
                        
            if start_idx != -1:
                idx = start_idx + 1
                while idx < len(lines):
                    line = lines[idx]
                    if any(term in line.lower() for term in ["identifica't", "inici", "rànquing", "imatges", "perfil", "competició:", "categoria:"]):
                        break
                        
                    if idx + 1 < len(lines) and "punts:" in lines[idx + 1].lower():
                        p_name = line.title()
                        p_pts = 0.0
                        pts_line = lines[idx + 1]
                        pts_match = re.search(r'punts:\s*([\d\.,]+)', pts_line, re.IGNORECASE)
                        if pts_match:
                            try:
                                p_pts = float(pts_match.group(1).replace(",", "."))
                            except:
                                p_pts = 0.0
                        roster.append({"name": p_name, "pts": p_pts})
                        idx += 2
                    else:
                        idx += 1
            
            print(f"   Roster raspado: {len(roster)} jugadores.")
            await page.go_back()
            await page.wait_for_timeout(2500)
        except Exception as e:
            print(f"   [ERR] Error al raspar detalle de equipo: {e}. Usando fallback.")
            
    if len(roster) < 3:
        print("   Usando fallback de roster estatico...")
        roster = fallback_roster
        
    # Estadísticas resumen
    stats = {"pj": 0, "pg": 0, "pp": 0, "sf": 0, "sc": 0}
    points = 0
    ranking = 0
    for st in standings:
        if st.get("isCurrent"):
            stats["pj"] = st["pj"]
            stats["pg"] = st["pg"]
            stats["pp"] = st["pp"]
            points = st["pts"]
            ranking = st["pos"]
            break
            
    # Próximo partido
    next_match = next((s for s in schedule if s["status"] == "upcoming"), None)
    
    return {
        "id": team_slug,
        "name": team_name.upper(),
        "category": cat,
        "division": division,
        "group": group_name,
        "captain": captain,
        "subcaptain": subcaptain,
        "ranking": ranking,
        "points": points,
        "stats": stats,
        "roster": roster,
        "schedule": schedule,
        "nextMatch": next_match,
        "groupStandings": standings,
        "logo": "img/logo_somospadel.png",
        "link": page.url
    }

async def main():
    print("=" * 60)
    print("  BOT v6 DIRECTO EXTRA VELOZ - SOMOS PADEL BCN")
    print("=" * 60)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage",
                  "--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900}
        )
        page = await context.new_page()
        page.set_default_timeout(60000)

        for target in TARGET_TEAMS:
            print(f"\n[PROCESANDO] {target['name']}...")
            try:
                # Usar URL específica del equipo si existe, si no usar TARGET_URL general
                team_url = target.get("url", TARGET_URL)
                # Reintentar hasta 3 veces si hay timeout
                for intento in range(3):
                    try:
                        await page.goto(team_url, wait_until="domcontentloaded", timeout=60000)
                        break
                    except Exception as goto_err:
                        print(f"   [REINTENTO {intento+1}/3] Error al cargar: {goto_err}")
                        if intento == 2:
                            raise
                        await page.wait_for_timeout(3000)
                await page.wait_for_timeout(3000)

                # 1. Seleccionar Categoria (Masculina, Femenina o Mixta)
                cat_terms = ["Masculí", "Masculina"]
                if target["cat"].lower() in ["mixta", "mixto", "mixte"]:
                    cat_terms = ["Mixte", "Mixta", "Mixto"]
                elif target["cat"].lower() in ["femenina", "femení", "femenino"]:
                    cat_terms = ["Femení", "Femenina", "Femenino"]
                
                print(f"   Seleccionando categoria con keywords: {cat_terms}...")
                await click_tab_robust(page, cat_terms)
                await page.wait_for_timeout(1500)

                # 2. Desplazar y clicar División (Tercera o Cuarta)
                div_keywords = []
                cat_letter = "M"
                if target["cat"].lower() in ["mixta", "mixto", "mixte"]:
                    cat_letter = "MX"
                elif target["cat"].lower() in ["femenina", "femení", "femenino"]:
                    cat_letter = "F"
                
                if "segunda" in target["div"].lower():
                    div_keywords = [f"{cat_letter}2", "Segunda"]
                elif "tercera" in target["div"].lower():
                    div_keywords = [f"{cat_letter}3", "Tercera"]
                elif "cuarta" in target["div"].lower():
                    if cat_letter == "MX":
                        div_keywords = ["MX4", "Quarta"]
                    else:
                        div_keywords = [f"{cat_letter}4", "Cuarta"]
                else:
                    div_keywords = [target["div"]]

                print(f"   Buscando division con keywords: {div_keywords}...")
                
                elements = await page.query_selector_all("li, .mbsc-lv-item")
                target_element = None
                for el in elements:
                    if not await el.is_visible():
                        continue
                    text = (await el.inner_text()).replace('\n', ' ').strip().lower()
                    if all(kw.lower() in text for kw in div_keywords):
                        target_element = el
                        break

                if not target_element:
                    print(f"   [ERR] Division {target['div']} no encontrada con keywords {div_keywords}.")
                    continue

                print(f"   Division encontrada. Clicando de forma nativa...")
                await target_element.scroll_into_view_if_needed()
                await target_element.click()
                await page.wait_for_timeout(2500)

                # Desplegar acordeones de grupos (solo si están cerrados!)
                try:
                    collapsibles = await page.query_selector_all(".mbsc-collapsible-header")
                    for col in collapsibles:
                        try:
                            if await col.is_visible():
                                aria_expanded = await col.get_attribute("aria-expanded")
                                if aria_expanded == "false":
                                    await col.click()
                                    await page.wait_for_timeout(150)
                        except:
                            pass
                except:
                    pass
                await page.wait_for_timeout(1000)

                # 3. Desplazar y clicar Grupo exacto
                group_name = target["group"]
                print(f"   Buscando grupo: '{group_name}'...")
                found_grp = False
                for scroll_attempt in range(25):
                    items = await page.query_selector_all("li, .mbsc-lv-item, .mbsc-grid-col")
                    target_grp_el = None
                    for item in items:
                        try:
                            if await item.is_visible():
                                text = (await item.inner_text()).replace('\n', ' ').strip().lower()
                                if group_name.lower() in text:
                                    target_grp_el = item
                                    break
                        except:
                            pass

                    if target_grp_el:
                        print(f"   Grupo encontrado! Clicando nativamente...")
                        await target_grp_el.scroll_into_view_if_needed()
                        await target_grp_el.click()
                        found_grp = True
                        break

                    await page.mouse.wheel(0, 350)
                    await page.wait_for_timeout(250)

                if not found_grp:
                    print(f"   [ERR] Grupo {group_name} no encontrado.")
                    continue

                await page.wait_for_timeout(2500)

                # 4. Extraer datos del grupo
                result = await scrape_group(page, target["cat"], target["div"], target["group"], target["slug"], target["name"])
                if result:
                    found_teams.append(result)
                    print(f"   [OK] Cazado {result['name']} | Grupo: {result['group']} | Roster: {len(result['roster'])} | PJ: {result['stats']['pj']}")

            except Exception as e:
                print(f"   [FATAL] Error procesando {target['name']}: {e}")

        await context.close()
        await browser.close()

    print(f"\n[RESULTADO] Sincronizacion de {len(found_teams)} equipos finalizada.")

    # Escribir el teams_data_auto.js limpio
    js_out = "// Generado automaticamente - Bot SOMOS PADEL BCN v6\n"
    js_out += "window.ExtractedTeamsData = "
    js_out += json.dumps(found_teams, ensure_ascii=False, indent=2)
    js_out += ";\n"

    with open(OUTPUT_JS, "w", encoding="utf-8") as f:
        f.write(js_out)

    print(f"\n[OK] {OUTPUT_JS} guardado con exito. Listo para la sincro total sin duplicados!")
    print("=" * 60)

    # === Sincronización automática con Firebase ===
    # 1. Intentar sincronización directa con Firebase Admin SDK (Ideal para nube/CI/CD o local optimizado)
    if not sync_via_admin_sdk(found_teams):
        # 2. Fallback: Simulación en navegador local con Playwright
        await run_auto_sync()

def sync_via_admin_sdk(teams_data):
    print("\n[ADMIN-SDK] Intentando sincronización directa con Firebase Admin SDK...")
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        print("[ADMIN-SDK] El paquete 'firebase-admin' no está instalado. Saltando...")
        return False
        
    try:
        cred_path = os.path.join(os.getcwd(), "firebase-key.json")
        cred = None
        
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            print(f"[ADMIN-SDK] Cargando credenciales desde '{cred_path}'...")
        elif os.environ.get("FIREBASE_SERVICE_ACCOUNT"):
            import tempfile
            print("[ADMIN-SDK] Cargando credenciales desde variable de entorno...")
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
                f.write(os.environ.get("FIREBASE_SERVICE_ACCOUNT"))
                temp_name = f.name
            cred = credentials.Certificate(temp_name)
            
        if not cred:
            print("[ADMIN-SDK] No se encontró 'firebase-key.json' ni la variable de entorno FIREBASE_SERVICE_ACCOUNT.")
            return False
            
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
            
        db = firestore.client()
        
        print("[ADMIN-SDK] Conexión establecida. Limpiando colección 'club_teams'...")
        docs = db.collection('club_teams').list_documents()
        batch = db.batch()
        deleted_count = 0
        for doc in docs:
            batch.delete(doc)
            deleted_count += 1
        if deleted_count > 0:
            batch.commit()
            
        print(f"[ADMIN-SDK] Subiendo {len(teams_data)} equipos...")
        for equipo in teams_data:
            db.collection('club_teams').document(equipo['id']).set(equipo)
            
        print("[ADMIN-SDK] [OK] ¡Sincronización directa en Firestore completada con éxito!")
        return True
    except Exception as e:
        print(f"[ADMIN-SDK] [ERR] Error en la sincronización directa: {e}")
        return False

async def run_auto_sync():
    print("\n[AUTO-SYNC] Iniciando sincronización automática con Firebase...")
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            url = "http://127.0.0.1:8080/admin.html"
            print(f"[AUTO-SYNC] Conectando al panel de administración en {url}...")
            try:
                await page.goto(url, timeout=12000, wait_until="domcontentloaded")
            except Exception as e:
                url = "http://[::1]:8080/admin.html"
                print(f"[AUTO-SYNC] Reintentando con IPv6 en {url}...")
                try:
                    await page.goto(url, timeout=12000, wait_until="domcontentloaded")
                except Exception as e2:
                    print(f"[AUTO-SYNC] [WARN] No se pudo conectar al servidor local: {e2}")
                    print("            Asegúrate de ejecutar INICIAR_SERVIDOR.bat antes del bot para la sincronización automática.")
                    await browser.close()
                    return
            
            # Introducir el PIN de acceso
            print("[AUTO-SYNC] Iniciando sesión...")
            await page.fill("#pin-input", "212121")
            await page.evaluate("() => document.getElementById('admin-login-btn').click()")
            await page.wait_for_timeout(2000)
            
            # Localizar el botón de sincronización
            print("[AUTO-SYNC] Buscando botón 'SINCRO SUMMAPADEL'...")
            sync_btn = await page.query_selector("button[onclick*='syncSummapadelData']")
            if not sync_btn:
                sync_btn = await page.query_selector("button:has-text('SINCRO SUMMAPADEL')")
                
            if sync_btn:
                # Aceptar los diálogos automáticamente
                page.on("dialog", lambda dialog: dialog.accept())
                
                print("[AUTO-SYNC] Clicando el botón usando JavaScript para evitar overlays...")
                await page.evaluate("(btn) => btn.click()", sync_btn)
                print("[AUTO-SYNC] Sincronizando datos en Firestore...")
                
                # Esperar a que el botón termine las fases y vuelva a su estado original
                success = False
                for _ in range(30):
                    await page.wait_for_timeout(1000)
                    btn_text = await page.evaluate("(btn) => btn.querySelector('.nav-text').innerText", sync_btn)
                    if "SINCRO SUMMAPADEL" in btn_text:
                        success = True
                        break
                
                if success:
                    print("[AUTO-SYNC] [OK] ¡Sincronización en Firebase completada con éxito!")
                else:
                    print("[AUTO-SYNC] [WARN] La sincronización tardó demasiado en completarse.")
            else:
                print("[AUTO-SYNC] [ERR] No se encontró el botón de sincronización.")
                
            await browser.close()
    except Exception as e:
        print(f"[AUTO-SYNC] [ERR] Error en el flujo de sincronización automática: {e}")

if __name__ == "__main__":
    asyncio.run(main())
