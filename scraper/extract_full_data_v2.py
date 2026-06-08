import asyncio
import os
import json
import re
from playwright.async_api import async_playwright

OUTPUT_JS = os.path.join(os.getcwd(), "js", "modules", "teams", "teams_data.js")

# The 3 official teams
TEAMS_CONFIG = [
    {"id": "somos-padel-bcn-3ma", "name": "SOMOS PÁDEL BCN 3MA", "search": "SOMOS P", "group_name": "3MB FASE 2 G3", "cat": "Masculina", "div": "Tercera", "ranking": 1},
    {"id": "somos-padel-bcn-3m-b", "name": "SOMOS PÀDEL BCN 3M B", "search": "SOMOS P", "group_name": "3MA FASE 2 G5", "cat": "Masculina", "div": "Tercera", "ranking": 4},
    {"id": "somos-padel-bcn-4m", "name": "SOMOS PÀDEL BCN 4M", "search": "SOMOS P", "group_name": "4MA FASE 2 G4", "cat": "Masculina", "div": "Cuarta", "ranking": 6}
]

async def smooth_scroll_and_find(page, text_to_find, element_selector="li"):
    print(f"      [~] Buscando '{text_to_find}' haciendo scroll...")
    for _ in range(20):
        # Check if it exists
        found = await page.evaluate(f"""(args) => {{
            let els = Array.from(document.querySelectorAll(args[1]));
            let target = els.find(e => e.innerText && e.innerText.includes(args[0]));
            if (target) {{
                target.scrollIntoView({{behavior: 'smooth', block: 'center'}});
                return true;
            }}
            return false;
        }}""", [text_to_find, element_selector])
        
        if found:
            await page.wait_for_timeout(1000)
            return True
            
        # Scroll down
        await page.mouse.wheel(0, 500)
        await page.wait_for_timeout(500)
    return False

async def click_element_by_text(page, text_to_find, element_selector="li"):
    await page.evaluate(f"""(args) => {{
        let els = Array.from(document.querySelectorAll(args[1]));
        let target = els.find(e => e.innerText && e.innerText.includes(args[0]));
        if (target) target.click();
    }}""", [text_to_find, element_selector])

async def scrape_group_data(page):
    await page.wait_for_timeout(2000)
    
    # 3. Extract Full Standings (Clasificació tab)
    await click_element_by_text(page, "Clasificació", "label")
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
                let df = cells.length > 6 ? cells[6] : 0; 
                
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
    await click_element_by_text(page, "Partits", "label")
    await page.wait_for_timeout(1500)

    # Scroll heavily to load all matches
    for _ in range(5):
        await page.mouse.wheel(0, 1000)
        await page.wait_for_timeout(500)
    
    await page.evaluate("""() => {
        document.querySelectorAll('.mbsc-listview-item').forEach(e => e.scrollIntoView());
    }""")
    await page.wait_for_timeout(1000)

    schedule = await page.evaluate("""() => {
        let items = Array.from(document.querySelectorAll('.mbsc-listview-item'));
        let data = [];
        let jNum = 1;
        
        // Remove duplicates if any
        let uniqueTexts = new Set();
        
        for (let item of items) {
            let text = item.innerText.trim();
            if (!text || uniqueTexts.has(text)) continue;
            uniqueTexts.add(text);
            
            let parts = text.split('\\n').map(p => p.trim()).filter(p => p);
            if (parts.length < 2) continue;
            
            let date = parts[0];
            let team1 = parts[1];
            let team2 = parts.length > 3 ? parts[3] : '';
            let score1 = parts.length > 2 ? parts[2] : '';
            let score2 = parts.length > 4 ? parts[4] : '';
            
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
                    score = score2 + " - " + score1;
                    status = "completed";
                }
            } else {
               let otherTeams = parts.filter(p => !p.toLowerCase().includes('somos') && isNaN(parseInt(p[0])) && p.length > 5);
               if(otherTeams.length > 0) opponent = otherTeams[otherTeams.length - 1];
               
               let nums = parts.filter(p => !isNaN(parseInt(p[0])) && p.length <= 2);
               if(nums.length >= 2) {
                   score = nums[0] + " - " + nums[1];
                   status = "completed";
               }
            }
            
            if(opponent && opponent.length > 30) opponent = opponent.substring(0, 30);
            if(!opponent || opponent.length < 3) opponent = "Rival por definir";

            if (opponent && opponent.toUpperCase() === 'BYE') {
                status = "completed";
                score = "Descansa";
            }

            data.push({
                j: jNum++,
                date: date,
                time: 'TBD',
                opponent: opponent,
                score: score,
                venue: 'Pista Asignada',
                isHome: isHome,
                status: status
            });
        }
        return data;
    }""")

    # 5. Extract Team Stats
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
    print("[BOT] Iniciando Extracción de Fuerza Bruta Visual...")
    
    existing_data_str = ""
    if os.path.exists(OUTPUT_JS):
        with open(OUTPUT_JS, "r", encoding="utf-8") as f:
            existing_data_str = f.read()
    
    json_match = re.search(r'window\.ClubTeamsData\s*=\s*(\[.*?\]);', existing_data_str, re.DOTALL)
    existing_teams = []
    if json_match:
        try:
            jstr = json_match.group(1)
            jstr = re.sub(r'([{,]\s*)([a-zA-Z0-9_]+)\s*:', r'\1"\2":', jstr)
            jstr = jstr.replace("'", '"')
            existing_teams = json.loads(jstr)
        except Exception:
            pass

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        await page.goto("https://summapadel.com/event/151")
        await page.wait_for_timeout(4000)

        # Click Masculina
        await click_element_by_text(page, "Masculina", "label")
        await page.wait_for_timeout(2000)

        final_teams = []

        for config in TEAMS_CONFIG:
            print(f"\\n[!] Procesando {config['name']}...")
            
            # Find and click Division (e.g., Tercera)
            found_div = await smooth_scroll_and_find(page, config["div"])
            if found_div:
                await click_element_by_text(page, config["div"])
                await page.wait_for_timeout(2000)
            
            # Open collapsibles just in case
            await page.evaluate("""() => { document.querySelectorAll('.mbsc-collapsible-header').forEach(h => h.click()); }""")
            await page.wait_for_timeout(1000)

            # Find and click Group
            found_group = await smooth_scroll_and_find(page, config["group_name"])
            if found_group:
                await click_element_by_text(page, config["group_name"])
                
                data = await scrape_group_data(page)
                
                if data:
                    print(f"   [OK] {config['name']} extraido. {len(data['groupStandings'])} equipos, {len(data['schedule'])} jornadas.")
                    
                    roster = []
                    captain = "Pendiente"
                    for et in existing_teams:
                        if et.get("id") == config["id"]:
                            roster = et.get("roster", [])
                            captain = et.get("captain", "Pendiente")
                            break

                    next_match = None
                    if data['schedule']:
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
                        "ranking": data['ranking'],
                        "points": data['points'],
                        "stats": data['stats'],
                        "roster": roster,
                        "schedule": data['schedule'],
                        "nextMatch": next_match,
                        "groupStandings": data['groupStandings'],
                        "logo": "img/logo_somospadel.png",
                        "link": "https://summapadel.com/event/151"
                    }
                    final_teams.append(final_team)
                
                # Go back to groups list
                await click_element_by_text(page, "Tornar", "div") # Try text 'Tornar' or back button
                await page.evaluate("""() => { let btn = document.querySelector('.mbsc-ic-arrow-left'); if(btn) btn.click(); }""")
                await page.wait_for_timeout(2000)
                
            else:
                print(f"   [ERROR] Grupo no encontrado: {config['group_name']}")
            
            # Go back to Categories
            await page.evaluate("""() => { let btn = document.querySelector('.mbsc-ic-arrow-left'); if(btn) btn.click(); }""")
            await page.wait_for_timeout(2000)

        await browser.close()

    if final_teams:
        js_content = "/**\n * teams_data.js - Centralized Club Teams Data\n * Sincronizado automaticamente con Summapadel (Full Data)\n */\n"
        js_content += "(function () {\n    window.ClubTeamsData = "
        js_content += json.dumps(final_teams, indent=4, ensure_ascii=False)
        js_content += ";\n})();\n"

        with open(OUTPUT_JS, "w", encoding="utf-8") as f:
            f.write(js_content)
        print(f"\\n[DONE] {OUTPUT_JS} actualizado con {len(final_teams)} equipos.")
    else:
        print("\\n[ERROR] No se extrajeron equipos.")

if __name__ == "__main__":
    asyncio.run(main())
