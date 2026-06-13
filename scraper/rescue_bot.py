
import asyncio
import os
import json
import re
from playwright.async_api import async_playwright

TARGET_URL = "https://summapadel.com/event/151"
CLUB_KEYWORDS = ["somos", "padel bcn", "somopadel", "somospadel"]
OUTPUT_JS = os.path.join(os.getcwd(), "scraper", "teams_data_auto.js")

# Grupos a rescatar
RESCUE_TARGETS = [
    {"div": "M3 Masculina - Tercera", "grp": "3MB FASE 2 G3", "cat": "Masculina", "tab": "Masculí"},
    {"div": "M4 Masculina - Cuarta",  "grp": "4MA FASE 2 G4", "cat": "Masculina", "tab": "Masculí"}
]

def slug(name):
    return re.sub(r'[^a-z0-9]', '-', name.lower()).strip('-')

def contains_club(text):
    tl = text.lower()
    return any(kw in tl for kw in CLUB_KEYWORDS)

async def scrape_group(page, cat, division, group_name):
    await page.wait_for_timeout(3000)
    page_text = await page.evaluate("() => document.body.innerText")
    
    # Nombre del equipo
    team_els = await page.query_selector_all("label.three-lines.mbsc-txt-s, .mbsc-listview-item-text")
    team_name = None
    for tel in team_els:
        txt = (await tel.inner_text()).strip()
        if contains_club(txt):
            team_name = txt
            break
    if not team_name: team_name = f"SOMOSPADEL BCN ({division})"

    # Standings
    standings = []
    try:
        clasif_tab = page.get_by_text("Clasificació", exact=False)
        if await clasif_tab.is_visible():
            await clasif_tab.click()
            await page.wait_for_timeout(2000)
    except: pass

    rows = await page.query_selector_all("tr, .mbsc-grid-row")
    for i, row in enumerate(rows):
        cell_texts = [(await c.inner_text()).strip() for c in await row.query_selector_all("td, .mbsc-grid-col")]
        if not cell_texts or len(cell_texts) < 2: continue
        name_cell = cell_texts[0]
        if not name_cell or "Pos" in name_cell or "Equip" in name_cell: continue

        def safe_int(val):
            try: return int(re.search(r'\d+', str(val)).group())
            except: return 0

        standings.append({
            "pos": i, "team": name_cell,
            "pj": safe_int(cell_texts[1]) if len(cell_texts) > 1 else 0,
            "pg": safe_int(cell_texts[2]) if len(cell_texts) > 2 else 0,
            "pp": safe_int(cell_texts[3]) if len(cell_texts) > 3 else 0,
            "df": 0, "pts": safe_int(cell_texts[-1]) if cell_texts else 0,
            **({"isCurrent": True} if contains_club(name_cell) else {})
        })

    # Schedule
    schedule = []
    try:
        matches_tab = page.get_by_text("Partits", exact=False)
        if await matches_tab.is_visible():
            await matches_tab.click()
            await page.wait_for_timeout(2000)
    except: pass

    match_els = await page.query_selector_all(".mbsc-listview-item")
    for j, row in enumerate(match_els[:15]):
        row_text = (await row.inner_text()).strip()
        if not contains_club(row_text): continue
        parts = [p.strip() for p in row_text.split("\n") if p.strip()]
        score = "Pendiente"
        opponent = "Por confirmar"
        score_parts = []
        for p in parts:
            if re.match(r'^\d+$', p) and len(p) <= 2: score_parts.append(p)
            elif len(p) > 3 and not contains_club(p) and not any(char.isdigit() for char in p[:2]): opponent = p
        if len(score_parts) >= 2: score = f"{score_parts[0]} - {score_parts[1]}"

        status_val = "completed" if (score != "Pendiente" or opponent == "BYE") else "upcoming"
        score_val = "Descansa" if opponent == "BYE" else score

        schedule.append({
            "j": j + 1, "date": parts[0] if parts else "TBD", "time": "TBD",
            "opponent": opponent, "score": score_val, "venue": "Por confirmar", "isHome": True,
            "status": status_val
        })

    return {
        "id": slug(team_name), "name": team_name.upper(), "category": cat,
        "division": division, "group": group_name, "captain": "Pendiente",
        "ranking": 0, "points": 0, "stats": {"pj": 0, "pg": 0, "pp": 0, "sf": 0, "sc": 0},
        "roster": [], "schedule": schedule,
        "nextMatch": next((s for s in schedule if s["status"] == "upcoming"), None),
        "groupStandings": standings, "logo": "img/logo_somospadel.png", "link": page.url
    }

async def main():
    # Cargar datos existentes
    existing_teams = []
    if os.path.exists(OUTPUT_JS):
        with open(OUTPUT_JS, "r", encoding="utf-8") as f:
            content = f.read()
            json_str = content.split("window.ExtractedTeamsData = ")[1].split(";")[0]
            existing_teams = json.loads(json_str)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        for target in RESCUE_TARGETS:
            print(f"[RESCUE] Buscando: {target['grp']} en {target['div']}...")
            await page.goto(TARGET_URL)
            await page.wait_for_timeout(4000)

            # Click Tab
            await page.locator("label.mbsc-segmented-item", has_text=target["tab"]).first.click()
            await page.wait_for_timeout(2000)

            # Click Category
            cat_el = page.locator("li.mbsc-lv-item", has_text=target["div"]).first
            await cat_el.scroll_into_view_if_needed()
            await cat_el.click()
            await page.wait_for_timeout(3000)

            # Expand collapsibles
            cols = await page.query_selector_all(".mbsc-collapsible-header")
            for col in cols: 
                await col.click()
                await page.wait_for_timeout(500)

            # Click Group
            grp_name = target["grp"]
            items = await page.query_selector_all("li.mbsc-lv-item, .mbsc-listview-item")
            target_el = None
            for item in items:
                itxt = (await item.inner_text()).strip()
                if grp_name in itxt:
                    target_el = item
                    break
            
            if target_el:
                await target_el.scroll_into_view_if_needed()
                await target_el.click()
                result = await scrape_group(page, target["cat"], target["div"], grp_name)
                if result:
                    # Merge
                    ids = [t["id"] for t in existing_teams]
                    if result["id"] not in ids:
                        existing_teams.append(result)
                        print(f"   [OK] Rescatado: {result['name']}")
            else:
                print(f"   [ERR] No se encontró {grp_name}")

        await browser.close()

    # Guardar final
    js_out = "// Generado automaticamente - Rescate SOMOSPADEL BCN\n"
    js_out += "window.ExtractedTeamsData = " + json.dumps(existing_teams, ensure_ascii=False, indent=2) + ";\n"
    with open(OUTPUT_JS, "w", encoding="utf-8") as f:
        f.write(js_out)
    print(f"[DONE] Datos actualizados en {OUTPUT_JS}")

if __name__ == "__main__":
    asyncio.run(main())
