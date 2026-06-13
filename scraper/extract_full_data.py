import asyncio
import os
import json
import re
from playwright.async_api import async_playwright

OUTPUT_JS = os.path.join(os.getcwd(), "js", "modules", "teams", "teams_data.js")

# The 3 official teams
TEAMS_CONFIG = [
    {"id": "somos-padel-bcn-3ma", "name": "SOMOS PÁDEL BCN 3MA", "search": "SOMOS P", "group_name": "3MB FASE 2 G3", "cat": "Masculina", "div": "Tercera (3M A)", "ranking": 1},
    {"id": "somos-padel-bcn-3m-b", "name": "SOMOS PÀDEL BCN 3M B", "search": "SOMOS P", "group_name": "3MA FASE 2 G5", "cat": "Masculina", "div": "Tercera (3M B)", "ranking": 4},
    {"id": "somos-padel-bcn-4m", "name": "SOMOS PÀDEL BCN 4M", "search": "SOMOS P", "group_name": "4MA FASE 2 G4", "cat": "Masculina", "div": "Cuarta (M4)", "ranking": 6}
]

async def scrape_group_data(page, group_name):
    print(f"   -> Buscando grupo: {group_name}")
    
    # 1. Expand all collapsibles using JS to ensure they are open
    await page.evaluate("""() => {
        document.querySelectorAll('.mbsc-collapsible-header').forEach(h => {
            if (h.getAttribute('aria-expanded') !== 'true') h.click();
        });
    }""")
    await page.wait_for_timeout(1000)

    # 2. Find the group and click it via JS
    found = await page.evaluate(f"""(gName) => {{
        let items = Array.from(document.querySelectorAll('li.mbsc-lv-item, .mbsc-listview-item'));
        let target = items.find(el => el.innerText.includes(gName));
        if (target) {{
            target.scrollIntoView();
            target.click();
            return true;
        }}
        return false;
    }}""", group_name)

    if not found:
        print(f"      [X] No se pudo encontrar el grupo {group_name} en el DOM.")
        return None

    await page.wait_for_timeout(2000)

    # 3. Extract Full Standings (Clasificació tab)
    # Try to click 'Clasificació' tab if it exists
    await page.evaluate("""() => {
        let tabs = Array.from(document.querySelectorAll('label.mbsc-segmented-item, .mbsc-segmented-item-text'));
        let classTab = tabs.find(el => el.innerText.includes('Clasificació') || el.innerText.includes('Clasificacio'));
        if (classTab) classTab.click();
    }""")
    await page.wait_for_timeout(1500)

    standings = await page.evaluate("""() => {
        let rows = Array.from(document.querySelectorAll('tr, .mbsc-grid-row'));
        let data = [];
        let pos = 1;
        for (let row of rows) {
            let cells = Array.from(row.querySelectorAll('td, .mbsc-grid-col')).map(c => c.innerText.trim());
            if (cells.length >= 2 && !cells[0].includes('Pos') && !cells[0].includes('Equip')) {
                let teamName = cells[0];
                let pts = cells[cells.length - 1];
                let pj = cells.length > 1 ? cells[1] : 0;
                let pg = cells.length > 2 ? cells[2] : 0;
                let pp = cells.length > 3 ? cells[3] : 0;
                let df = cells.length > 6 ? cells[6] : 0; // Assuming difference is around col 6
                
                data.push({
                    pos: pos++,
                    team: teamName,
                    pj: parseInt(pj) || 0,
                    pg: parseInt(pg) || 0,
                    pp: parseInt(pp) || 0,
                    df: parseInt(df) || 0,
                    pts: parseInt(pts) || 0,
                    isCurrent: teamName.toLowerCase().includes('somos')
                });
            }
        }
        return data;
    }""")

    # 4. Extract Full Schedule (Partits tab)
    await page.evaluate("""() => {
        let tabs = Array.from(document.querySelectorAll('label.mbsc-segmented-item, .mbsc-segmented-item-text'));
        let partitsTab = tabs.find(el => el.innerText.includes('Partits'));
        if (partitsTab) partitsTab.click();
    }""")
    await page.wait_for_timeout(1500)

    schedule = await page.evaluate("""() => {
        let items = Array.from(document.querySelectorAll('.mbsc-listview-item'));
        let data = [];
        let jNum = 1;
        for (let item of items) {
            let text = item.innerText.trim();
            if (!text) continue;
            let parts = text.split('\\n').map(p => p.trim()).filter(p => p);
            if (parts.length < 2) continue;
            
            let date = parts[0];
            let team1 = parts[1];
            let team2 = parts.length > 3 ? parts[3] : '';
            let score1 = parts.length > 2 ? parts[2] : '';
            let score2 = parts.length > 4 ? parts[4] : '';
            
            // Try to figure out opponent and score
            let opponent = "Por confirmar";
            let score = "Pendiente";
            let status = "upcoming";
            let isHome = true;
            
            if (team1.toLowerCase().includes('somos')) {
                opponent = team2;
                isHome = true;
                if (score1 && score2 && !isNaN(parseInt(score1))) {
                    score = score1 + " - " + score2;
                    status = "completed";
                }
            } else if (team2.toLowerCase().includes('somos')) {
                opponent = team1;
                isHome = false;
                 if (score1 && score2 && !isNaN(parseInt(score1))) {
                    score = score2 + " - " + score1; // Somos score first
                    status = "completed";
                }
            } else if (text.toLowerCase().includes('somos')) {
               // Fallback parser if structure is different
               let otherTeams = parts.filter(p => !p.toLowerCase().includes('somos') && isNaN(parseInt(p[0])));
               if(otherTeams.length > 0) opponent = otherTeams[otherTeams.length - 1];
               
               let nums = parts.filter(p => !isNaN(parseInt(p[0])) && p.length <= 2);
               if(nums.length >= 2) {
                   score = nums[0] + " - " + nums[1];
                   status = "completed";
               }
            } else {
               // Not a somos match, maybe ignore or keep? We only want team schedule.
               continue; 
            }
            
            // Limit opponent name length
            if(opponent && opponent.length > 30) opponent = opponent.substring(0, 30);
            if(!opponent) opponent = "TBD";

            data.push({
                j: jNum++,
                date: date,
                time: 'TBD', // Summapadel usually doesn't show exact time in this view clearly without opening
                opponent: opponent,
                score: score,
                venue: 'Ver en Summapadel',
                isHome: isHome,
                status: status
            });
        }
        return data;
    }""")

    # 5. Extract Team Stats (from standings)
    stats = {"pj": 0, "pg": 0, "pp": 0, "sf": 0, "sc": 0}
    points = 0
    ranking = 0
    for st in standings:
        if st.get('isCurrent'):
            stats['pj'] = st['pj']
            stats['pg'] = st['pg']
            stats['pp'] = st['pp']
            points = st['pts']
            ranking = st['pos']
            break

    return {
        "groupStandings": standings,
        "schedule": schedule,
        "stats": stats,
        "points": points,
        "ranking": ranking
    }

async def main():
    print("[BOT] Iniciando Extracción Profunda (Full Data)...")
    
    # Cargar archivo local actual para preservar 'roster' (plantillas)
    existing_data_str = ""
    with open(OUTPUT_JS, "r", encoding="utf-8") as f:
        existing_data_str = f.read()
    
    # Extraer el array JSON del JS
    json_match = re.search(r'window\.ClubTeamsData\s*=\s*(\[.*?\]);', existing_data_str, re.DOTALL)
    existing_teams = []
    if json_match:
        try:
            # Reemplazar claves sin comillas por claves con comillas dobles para parsear
            jstr = json_match.group(1)
            jstr = re.sub(r'([{,]\s*)([a-zA-Z0-9_]+)\s*:', r'\1"\2":', jstr)
            jstr = jstr.replace("'", '"')
            existing_teams = json.loads(jstr)
        except Exception as e:
            print("No se pudo parsear el JSON actual, se crearán datos base.", e)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        await page.goto("https://summapadel.com/event/151")
        await page.wait_for_timeout(3000)

        # Select Masculina Tab first
        await page.evaluate("""() => {
            let tabs = Array.from(document.querySelectorAll('label.mbsc-segmented-item'));
            let mascTab = tabs.find(el => el.innerText.includes('Mascul'));
            if (mascTab) mascTab.click();
        }""")
        await page.wait_for_timeout(1000)

        final_teams = []

        for config in TEAMS_CONFIG:
            print(f"\\n[!] Procesando {config['name']}...")
            
            # Navigate to category
            await page.evaluate(f"""(divName) => {{
                let items = Array.from(document.querySelectorAll('li.mbsc-lv-item'));
                let target = items.find(el => el.innerText.includes(divName));
                if (target) {{ target.scrollIntoView(); target.click(); }}
            }}""", config["div"].split(" ")[0]) # e.g. "Tercera" or "Cuarta"
            
            await page.wait_for_timeout(2000)
            
            data = await scrape_group_data(page, config["group_name"])
            
            # Go back to categories for next team
            await page.evaluate("""() => {
                let backBtn = document.querySelector('.mbsc-ic-arrow-left, .mbsc-fr-btn');
                if (backBtn) backBtn.click();
            }""")
            await page.wait_for_timeout(1000)
            await page.evaluate("""() => {
                let backBtn = document.querySelector('.mbsc-ic-arrow-left, .mbsc-fr-btn');
                if (backBtn) backBtn.click();
            }""")
            await page.wait_for_timeout(1000)

            # Preserve roster and merge data
            roster = []
            captain = "Pendiente"
            for et in existing_teams:
                if et.get("id") == config["id"]:
                    roster = et.get("roster", [])
                    captain = et.get("captain", "Pendiente")
                    break

            next_match = None
            if data and data['schedule']:
                for m in data['schedule']:
                    if m['status'] == 'upcoming':
                        next_match = {"opponent": m['opponent'], "date": m['date'], "time": m['time'], "isHome": m['isHome']}
                        break

            final_team = {
                "id": config["id"],
                "name": config["name"],
                "category": config["cat"],
                "division": config["div"],
                "group": config["group_name"],
                "captain": captain,
                "ranking": data['ranking'] if data else config["ranking"],
                "points": data['points'] if data else 0,
                "stats": data['stats'] if data else {"pj": 0, "pg": 0, "pp": 0, "sf": 0, "sc": 0},
                "roster": roster,
                "schedule": data['schedule'] if data else [],
                "nextMatch": next_match,
                "groupStandings": data['groupStandings'] if data else [],
                "logo": "img/logo_somospadel.png",
                "link": "https://summapadel.com/event/151"
            }
            final_teams.append(final_team)
            print(f"   [OK] {config['name']} procesado con éxito.")

        await browser.close()

    # Write back to JS file
    js_content = "/**\n * teams_data.js - Centralized Club Teams Data\n * Sincronizado automaticamente con Summapadel (Full Data)\n */\n"
    js_content += "(function () {\n    window.ClubTeamsData = "
    js_content += json.dumps(final_teams, indent=4, ensure_ascii=False)
    js_content += ";\n})();\n"

    with open(OUTPUT_JS, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"\\n[DONE] Archivo {OUTPUT_JS} actualizado con Full Data.")

if __name__ == "__main__":
    asyncio.run(main())
