import asyncio
import os
import json
import re
import sys
from playwright.async_api import async_playwright

TARGET_TEAMS = [
    {
        "slug": "somos-padel-bcn-4fa",
        "name": "SOMOS PÁDEL BCN 4FA",
        "div": "Cuarta",
        "group": "4FB FASE 2 G3",
        "cat": "Femenina",
        "url": "https://summapadel.com/event/151"
    }
]

CLUB_KEYWORDS = ["somos", "padel bcn", "somopadel", "somospadel"]
EXISTING_TEAMS_JS = os.path.join(os.getcwd(), "js", "modules", "teams", "teams_data.js")

existing_teams = []
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
            print(f"Loaded {len(existing_teams)} fallback teams from teams_data.js")
    except Exception as e:
        print(f"Fallback load warning: {e}")

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

async def click_tab_robust(page, terms):
    for term in terms:
        try:
            handle = await page.evaluate_handle(f"""(term) => {{
                let elements = Array.from(document.querySelectorAll('li, button, a, label, .mbsc-segmented-item, .mbsc-scv-item, span, b, div, .mbsc-segmented-item-text'));
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

async def scrape_group(page, cat, division, group_name, team_slug, target_name):
    print(f"   Iniciando raspado del grupo {group_name}...")
    await page.wait_for_timeout(2000)
    
    # === 1. Partidos ===
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
                continue
                
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
    
    fallback_roster = []
    for et in existing_teams:
        if et.get("id") == team_slug:
            fallback_roster = et.get("roster", [])
            captain = et.get("captain", "Pendiente")
            subcaptain = et.get("subcaptain", "Pendiente")
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
        "groupStandings": standings,
        "logo": "img/logo_somospadel.png",
        "link": page.url
    }

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900}
        )
        page = await context.new_page()
        page.set_default_timeout(60000)
        
        target = TARGET_TEAMS[0]
        print(f"\n[PROCESANDO] {target['name']}...")
        
        await page.goto(target["url"], wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(3000)
        
        # 1. Select Femenina Tab
        cat_terms = ["Femení", "Femenina", "Femenino"]
        print(f"Selecting category with keywords: {cat_terms}...")
        await click_tab_robust(page, cat_terms)
        await page.wait_for_timeout(1500)
        
        # 2. Find and click Cuarta Division
        div_keywords = ["F4", "Cuarta"]
        print(f"Finding division with keywords: {div_keywords}...")
        
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
            print(f"Division {target['div']} not found.")
            await browser.close()
            return

        print(f"Division found. Clicking de forma nativa...")
        await target_element.scroll_into_view_if_needed()
        await target_element.click()
        await page.wait_for_timeout(2500)

        # Expand collapsibles
        try:
            collapsibles = await page.query_selector_all(".mbsc-collapsible-header")
            for col in collapsibles:
                if await col.is_visible():
                    aria_expanded = await col.get_attribute("aria-expanded")
                    if aria_expanded == "false":
                        await col.click()
                        await page.wait_for_timeout(150)
        except:
            pass
        await page.wait_for_timeout(1000)

        # 3. Find and click Group
        group_name = target["group"]
        print(f"Searching group: '{group_name}'...")
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
                print(f"Group found! Clicking natively...")
                await target_grp_el.scroll_into_view_if_needed()
                await target_grp_el.click()
                found_grp = True
                break

            await page.mouse.wheel(0, 350)
            await page.wait_for_timeout(250)

        if not found_grp:
            print(f"Group {group_name} not found.")
            await browser.close()
            return

        await page.wait_for_timeout(2500)

        # 4. Scrape the data
        result = await scrape_group(page, target["cat"], target["div"], target["group"], target["slug"], target["name"])
        print("\n=== SCRAPED RESULT ===")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
