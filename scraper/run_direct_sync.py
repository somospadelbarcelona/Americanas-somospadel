import asyncio
import os
import json
import re
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(line_buffering=True, encoding='utf-8')

TARGET_URL = "https://summapadel.com/event/151"
TEAMS_DATA_PATH = os.path.join(os.getcwd(), "js", "modules", "teams", "teams_data.js")

# Mapeo exacto por equipo a partir de la configuración oficial probada
CAT_CODES = {
    "3ma": {"cat_code": "m3",  "group_kw": "3mb fase 2 g3", "name": "SOMOS PÁDEL BCN 3MA"},
    "3mb": {"cat_code": "m3",  "group_kw": "3ma fase 2 g5", "name": "SOMOS PÁDEL BCN 3MB"},
    "4m":  {"cat_code": "m4",  "group_kw": "4ma fase 2 g4", "name": "SOMOS PÁDEL BCN 4M"},
    "4xa": {"cat_code": "mx4", "group_kw": "4xb fase 2 g1", "name": "SOMOS PÁDEL BCN 4XA"},
    "4xb": {"cat_code": "mx4", "group_kw": "4xb fase 2 g1", "name": "SOMOS PÁDEL BCN 4XB"},
    "3xa": {"cat_code": "mx3", "group_kw": "3xb fase 2 g3", "name": "SOMOS PÁDEL BCN 3X"},
    "4fa": {"cat_code": "f4",  "group_kw": "4fb fase 2 g3", "name": "SOMOS PÁDEL BCN 4FA"},
    "2f":  {"cat_code": "f2",  "group_kw": "2fb fase 2 g2", "name": "SOMOS PÁDEL BCN 2F"}
}

def save_teams(club_teams):
    with open(TEAMS_DATA_PATH, "r", encoding="utf-8") as f:
        js_content = f.read()
    new_json = json.dumps(club_teams, ensure_ascii=False, indent=2)
    new_js_content = re.sub(
        r'window\.ClubTeamsData\s*=\s*(\[[\s\S]*?\])\s*;',
        f'window.ClubTeamsData = {new_json};',
        js_content
    )
    with open(TEAMS_DATA_PATH, "w", encoding="utf-8") as f:
        f.write(new_js_content)
    print("   [GUARDADO] teams_data.js actualizado en disco.")

async def inspect_and_sync():
    print("=============================================================")
    print("  SINCRONIZACIÓN OFICIAL EN VIVO - SOMOS PÁDEL BCN (8 EQUIPOS)")
    print("=============================================================")
    
    with open(TEAMS_DATA_PATH, "r", encoding="utf-8") as f:
        js_content = f.read()
    
    match = re.search(r'window\.ClubTeamsData\s*=\s*(\[[\s\S]*?\])\s*;', js_content)
    if not match:
        print("[ERROR] No se pudo encontrar window.ClubTeamsData")
        return
        
    club_teams = json.loads(match.group(1))
    print(f"Cargados {len(club_teams)} equipos de teams_data.js")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 900})
        
        for team_info in club_teams:
            slug = team_info.get("id") or team_info.get("slug")
            code_key = None
            if "3m-a" in slug or "3ma" in slug: code_key = "3ma"
            elif "3m-b" in slug or "3mb" in slug: code_key = "3mb"
            elif "4m" in slug and "x" not in slug and "f" not in slug: code_key = "4m"
            elif "4xa" in slug or "4x-a" in slug: code_key = "4xa"
            elif "4xb" in slug or "4x-b" in slug: code_key = "4xb"
            elif "3xa" in slug or "3x" in slug: code_key = "3xa"
            elif "4fa" in slug or "4f" in slug: code_key = "4fa"
            elif "2f" in slug: code_key = "2f"
            
            if not code_key or code_key not in CAT_CODES:
                continue
                
            cfg = CAT_CODES[code_key]
            cat_code = cfg["cat_code"]
            team_name = team_info.get("name", cfg["name"])
            group_kw = cfg["group_kw"].lower()
            
            print(f"\n[{team_name}] Cat: {cat_code.upper()} | Grupo objetivo: '{group_kw}'...")
            
            # Navegar a la página principal del evento
            try:
                await page.goto(TARGET_URL, wait_until="domcontentloaded", timeout=40000)
                await page.wait_for_timeout(2000)
            except Exception as e:
                print(f"   [REINTENTO GOTO] {e}")
                await page.goto(TARGET_URL, wait_until="domcontentloaded", timeout=40000)
                await page.wait_for_timeout(2000)
                
            # Seleccionar la pestaña principal superior (Masculí, Femení, Mixte)
            target_top_tab = "mascul"
            if cat_code.startswith("mx"):
                target_top_tab = "mixt"
            elif cat_code.startswith("f"):
                target_top_tab = "femen"
                
            tabs = await page.query_selector_all(".mbsc-segmented-item, .mbsc-tab, button, [role='tab']")
            for t in tabs:
                try:
                    txt = (await t.inner_text()).lower()
                    if target_top_tab in txt:
                        await t.scroll_into_view_if_needed()
                        await t.click()
                        await page.wait_for_timeout(1500)
                        break
                except:
                    pass
                    
            # Localizar categoría (.evd-cat)
            cats = await page.query_selector_all(".evd-cat")
            cat_el = None
            for c in cats:
                try:
                    if not await c.is_visible():
                        continue
                    text = (await c.inner_text()).lower()
                    lines = [l.strip().lower() for l in text.split("\n") if l.strip()]
                    if any(l == cat_code for l in lines) or f"{cat_code} " in text or f" {cat_code}" in text:
                        cat_el = c
                        break
                except:
                    pass
                    
            if not cat_el:
                print(f"   [AVISO] No se encontró categoría visible para {cat_code}")
                continue
                
            await cat_el.scroll_into_view_if_needed()
            await page.wait_for_timeout(300)
            await cat_el.click()
            await page.wait_for_timeout(2500)
            
            # Buscar grupo exacto
            grp_els = await page.query_selector_all(".gcat-grp-name")
            target_grp_el = None
            matched_grp_name = ""
            for g in grp_els:
                t = (await g.inner_text()).strip()
                if group_kw in t.lower():
                    target_grp_el = g
                    matched_grp_name = t
                    break
                    
            if not target_grp_el:
                print(f"   [AVISO] Grupo '{group_kw}' no encontrado en {len(grp_els)} grupos de {cat_code.upper()}.")
                continue
                
            print(f"   -> Clicando grupo '{matched_grp_name}'...")
            await target_grp_el.scroll_into_view_if_needed()
            await target_grp_el.click()
            await page.wait_for_timeout(3000)
            
            # 1. Extraer Partidos (Jornades)
            schedule = []
            calendar_stats = {}
            for _ in range(5):
                await page.mouse.wheel(0, 900)
                await page.wait_for_timeout(200)
                
            match_rows = await page.query_selector_all(".mbsc-lv-item")
            j_count = 1
            for row in match_rows:
                try:
                    if not await row.is_visible():
                        continue
                    row_text = (await row.inner_text()).strip()
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
                        
                    def norm_t(n): return re.sub(r'[^a-z0-9]', '', n.lower())
                    n1 = norm_t(team1)
                    n2 = norm_t(team2)
                    if n1 not in calendar_stats: calendar_stats[n1] = {"pj": 0, "pg": 0, "pp": 0, "pts": 0}
                    if n2 not in calendar_stats: calendar_stats[n2] = {"pj": 0, "pg": 0, "pp": 0, "pts": 0}
                    
                    if is_completed and score1 and score2:
                        s1, s2 = int(score1), int(score2)
                        calendar_stats[n1]["pj"] += 1
                        calendar_stats[n1]["pts"] += s1
                        calendar_stats[n2]["pj"] += 1
                        calendar_stats[n2]["pts"] += s2
                        if s1 > s2:
                            calendar_stats[n1]["pg"] += 1
                            calendar_stats[n2]["pp"] += 1
                        else:
                            calendar_stats[n2]["pg"] += 1
                            calendar_stats[n1]["pp"] += 1
                            
                    clean_target = norm_t(team_name)
                    # Comprobación estricta para evitar solapes de nombres similares
                    is_team1_ours = clean_target in n1 or (("4xa" in code_key and "4xa" in n1) or ("4xb" in code_key and "4xb" in n1) or ("3ma" in code_key and "3ma" in n1) or ("3mb" in code_key and "3mb" in n1) or ("4m" == code_key and "4m" in n1 and "x" not in n1 and "f" not in n1))
                    is_team2_ours = clean_target in n2 or (("4xa" in code_key and "4xa" in n2) or ("4xb" in code_key and "4xb" in n2) or ("3ma" in code_key and "3ma" in n2) or ("3mb" in code_key and "3mb" in n2) or ("4m" == code_key and "4m" in n2 and "x" not in n2 and "f" not in n2))
                    
                    if not is_team1_ours and not is_team2_ours:
                        if "somos" in n1 and ("4x" not in code_key or code_key in n1): is_team1_ours = True
                        elif "somos" in n2 and ("4x" not in code_key or code_key in n2): is_team2_ours = True
                        else: continue
                        
                    opponent = team2 if is_team1_ours else team1
                    score_str = f"{score1} - {score2}" if (score1 and score2) else "Pendiente"
                    is_home = is_team1_ours
                    
                    match_res = None
                    if is_completed and score1 and score2:
                        s1, s2 = int(score1), int(score2)
                        our_s = s1 if is_team1_ours else s2
                        opp_s = s2 if is_team1_ours else s1
                        match_res = "W" if our_s > opp_s else "L"
                        status_final = "completed"
                    else:
                        status_final = "scheduled"
                        
                    schedule.append({
                        "j": j_num,
                        "date": date,
                        "time": time_str,
                        "opponent": opponent.upper(),
                        "score": score_str,
                        "location": venue,
                        "isHome": is_home,
                        "status": status_final,
                        **({"result": match_res} if match_res else {})
                    })
                    j_count += 1
                except:
                    pass
                    
            schedule.sort(key=lambda x: x["j"])
            print(f"   -> Partidos: {len(schedule)} extraídos.")
            
            # 2. Extraer Clasificación
            tabs = await page.query_selector_all("button, .mbsc-segmented-item, .mbsc-tab, a, div[role='tab']")
            for tb in tabs:
                t = (await tb.inner_text()).lower()
                if "classificac" in t or "standing" in t:
                    await tb.click()
                    await page.wait_for_timeout(2000)
                    break
                    
            standings = []
            clasif_rows = await page.query_selector_all(".mbsc-lv-item")
            for crow in clasif_rows:
                try:
                    if not await crow.is_visible():
                        continue
                    rtxt = (await crow.inner_text()).strip()
                    lines = [l.strip() for l in rtxt.split("\n") if l.strip()]
                    if len(lines) < 3:
                        continue
                        
                    stats_parts = lines[0].split()
                    pj = int(re.search(r'\d+', stats_parts[0]).group()) if len(stats_parts) >= 1 else 0
                    pts = int(re.search(r'\d+', stats_parts[1]).group()) if len(stats_parts) >= 2 else 0
                    
                    team_cell = lines[1]
                    norm_name = re.sub(r'[^a-z0-9]', '', team_cell.lower())
                    
                    if norm_name in calendar_stats and calendar_stats[norm_name]["pj"] > 0:
                        cstat = calendar_stats[norm_name]
                        if cstat["pj"] >= pj:
                            pj = cstat["pj"]
                            pts = cstat["pts"]
                            pg = cstat["pg"]
                            pp = cstat["pp"]
                        else:
                            pg = cstat["pg"]
                            pp = cstat["pp"] + (pj - cstat["pj"])
                    else:
                        pg = min(pj, pts // 2)
                        pp = max(0, pj - pg)
                        
                    clean_target = re.sub(r'[^a-z0-9]', '', team_name.lower())
                    is_cur = clean_target in norm_name or (code_key in norm_name and "somos" in norm_name)
                    
                    standings.append({
                        "pos": len(standings) + 1,
                        "team": team_cell.upper(),
                        "pj": pj,
                        "pg": pg,
                        "pp": pp,
                        "df": 0,
                        "pts": pts,
                        **({"isCurrent": True} if is_cur else {})
                    })
                except:
                    pass
                    
            print(f"   -> Clasificación: {len(standings)} equipos.")
            
            if len(standings) > 0:
                team_info["groupStandings"] = standings
                cur_team = next((s for s in standings if s.get("isCurrent")), None)
                if cur_team:
                    team_info["pos"] = cur_team["pos"]
                    team_info["points"] = cur_team["pts"]
                    team_info["stats"]["pj"] = cur_team["pj"]
                    team_info["stats"]["pg"] = cur_team["pg"]
                    team_info["stats"]["pp"] = cur_team["pp"]
                    print(f"   [SYNC OK] Pos #{team_info['pos']}, {team_info['points']} Pts, PJ {team_info['stats']['pj']}")
                    
            if len(schedule) > 0:
                team_info["schedule"] = schedule
                
            # Guardado incremental por equipo
            save_teams(club_teams)
            
        await browser.close()
        
    print("\n[FINALIZADO CON ÉXITO] Todos los equipos sincronizados.")

if __name__ == "__main__":
    asyncio.run(inspect_and_sync())
