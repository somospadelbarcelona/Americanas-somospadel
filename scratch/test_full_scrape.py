import asyncio
import sys
import re
import json
from playwright.async_api import async_playwright

sys.stdout.reconfigure(line_buffering=True)

CLUB_KEYWORDS = ["somos", "padel bcn", "somopadel", "somospadel"]

def contains_club(text):
    tl = text.lower()
    return any(kw in tl for kw in CLUB_KEYWORDS)

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

async def scrape_group(page, cat, division, group_name, team_slug):
    print(f"   Iniciando raspado del grupo {group_name}...")
    await page.wait_for_timeout(2000)
    
    # 1. RASPAR PARTIDOS
    schedule = []
    print("   Raspando partidos (pestana Jornades)...")
    for _ in range(3):
        await page.mouse.wheel(0, 500)
        await page.wait_for_timeout(250)
        
    match_els = await page.query_selector_all(".mbsc-lv-item")
    print(f"   Encontradas {len(match_els)} filas en Jornades (.mbsc-lv-item)")
    j_count = 1
    for row in match_els:
        try:
            if not await row.is_visible():
                continue
            row_text = (await row.inner_text()).strip()
            print(f"      Fila Jornades visible: '{row_text.replace(chr(10), ' ')}'")
            if not row_text:
                continue
            if not contains_club(row_text):
                print(f"      [SKIP] No contiene club keywords")
                continue
                
            lines = [l.strip() for l in row_text.split("\n") if l.strip()]
            print(f"      Fila Jornades parseando lines={lines}")
            if len(lines) < 7:
                print(f"      [SKIP] Menos de 7 lineas")
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
                
            opponent = "Por confirmar"
            score = "Pendiente"
            status = "upcoming"
            isHome = True
            
            if contains_club(team1):
                opponent = team2
                isHome = True
                if is_completed:
                    score = f"{score1} - {score2}"
                    status = "completed"
            elif contains_club(team2):
                opponent = team1
                isHome = False
                if is_completed:
                    score = f"{score2} - {score1}"
                    status = "completed"
                    
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
            print(f"      [ADD MATCH] J {j_num} vs {opponent} ({score})")
            j_count += 1
        except Exception as e:
            print(f"      [ERR] Error parseando fila de partido: {e}")

    schedule.sort(key=lambda x: x["j"])
    print(f"   Partidos raspados: {len(schedule)}")

    # 2. CLIC EN CLASIFICACIÓ
    print("   Cambiando a pestana Classificacio...")
    await click_tab_robust(page, ["Classificació", "Classificación", "Classificacion", "Standing"])
    await page.wait_for_timeout(2000)
    
    # 3. RASPAR CLASIFICACIÓN
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
            print(f"      Fila Clasif visible: '{row_text.replace(chr(10), ' ')}'")
            lines = [l.strip() for l in row_text.split("\n") if l.strip()]
            print(f"      Fila Clasif parseando lines={lines}")
            if len(lines) < 3:
                print(f"      [SKIP] Menos de 3 lineas")
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
            
            is_current = contains_club(name_cell)
            if is_current:
                target_row_element = row
                team_name = name_cell
                print(f"      [OWN TEAM FOUND] {team_name}")
                
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
            print(f"      [ADD CLASIF] Pos {len(standings)}: {name_cell.upper()} (PJ: {pj}, PTS: {pts})")
        except Exception as e:
            print(f"      [ERR] Error parseando fila de clasificacion: {e}")

    print(f"   Clasificacion raspada: {len(standings)} equipos.")

    # 4. CLIC EN EL EQUIPO PARA OBTENER PLANTILLA Y CAPITÁN
    roster = []
    captain = "Pendiente"
    subcaptain = "Pendiente"
    
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
            print(f"   [ERR] Error al raspar detalle de equipo: {e}")
            
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
        "groupStandings": standings
    }

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        print("Navigating to event page...")
        await page.goto("https://summapadel.com/event/151", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        # Masculina
        await click_tab_robust(page, ["Masculí", "Masculina"])
        await page.wait_for_timeout(2000)

        # Click Tercera
        elements = await page.query_selector_all("li, .mbsc-lv-item")
        print(f"Encontrados {len(elements)} elementos en la pagina inicial.")
        clicked_div = False
        for el in elements:
            text = (await el.inner_text()).replace('\n', ' ').strip().lower()
            if "m3" in text and "tercera" in text:
                print(f"Clicando division: '{text}'")
                await el.click()
                clicked_div = True
                break
        if not clicked_div:
            print("ERROR: No se encontro la division Tercera!")
        await page.wait_for_timeout(3500)

        # Desplegar acordeones de grupos (solo si están cerrados!)
        try:
            collapsibles = await page.query_selector_all(".mbsc-collapsible-header")
            print(f"Encontrados {len(collapsibles)} acordeones de grupos.")
            for col in collapsibles:
                try:
                    if await col.is_visible():
                        aria_expanded = await col.get_attribute("aria-expanded")
                        if aria_expanded == "false":
                            print(f"Desplegando acordeon: {await col.inner_text()}")
                            await col.click()
                            await page.wait_for_timeout(200)
                except:
                    pass
        except:
            pass
        await page.wait_for_timeout(1500)

        # Click grupo 3MB FASE 2 G3
        items = await page.query_selector_all("li, .mbsc-lv-item, .mbsc-grid-col")
        print(f"Encontrados {len(items)} items buscando el grupo.")
        found_group = False
        for item in items:
            text = (await item.inner_text()).replace('\n', ' ').strip().lower()
            if "3mb fase 2 g3" in text:
                print(f"Grupo encontrado para clicar: {text}")
                await item.click()
                found_group = True
                break
        if not found_group:
            print("ERROR: No se encontro el grupo '3mb fase 2 g3'!")
            
        await page.wait_for_timeout(3000)

        result = await scrape_group(page, "Masculina", "Tercera", "3MB FASE 2 G3", "somos-padel-bcn-3ma")
        print("\n=== FINAL SCRAPED DATA ===")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        with open("scratch/test_scraped_data.json", "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print("Guardado en scratch/test_scraped_data.json")
        
        await browser.close()

asyncio.run(main())
