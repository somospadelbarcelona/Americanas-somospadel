import asyncio
import json
import re
from playwright.async_api import async_playwright

async def main():
    print("Starting Playwright to scrape live 'somos-padel-bcn-4fa' data...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900}
        )
        page = await context.new_page()
        page.set_default_timeout(60000)
        
        url = "https://summapadel.com/event/151"
        print(f"Loading {url}...")
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(3000)
        
        # 1. Select Femenina Tab
        print("Selecting Femení tab...")
        await page.evaluate("""() => {
            let tabs = Array.from(document.querySelectorAll('li, button, a, label, .mbsc-segmented-item, .mbsc-scv-item, span, b, div'));
            let fTab = tabs.find(e => e.innerText && e.innerText.trim().toLowerCase().includes('femení'));
            if (fTab) {
                fTab.click();
                return true;
            }
            return false;
        }""")
        await page.wait_for_timeout(2000)
        
        # 2. Find Division Cuarta
        print("Finding Division Cuarta...")
        div_keywords = ["F4", "Cuarta"]
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
            print("Division Cuarta not found in DOM!")
            await browser.close()
            return
            
        await target_element.scroll_into_view_if_needed()
        await target_element.click()
        await page.wait_for_timeout(2500)
        
        # Open collapsibles if closed
        try:
            collapsibles = await page.query_selector_all(".mbsc-collapsible-header")
            for col in collapsibles:
                if await col.is_visible():
                    aria_expanded = await col.get_attribute("aria-expanded")
                    if aria_expanded == "false":
                        await col.click()
                        await page.wait_for_timeout(150)
        except Exception as e:
            print("Collapsibles error:", e)
        await page.wait_for_timeout(1000)
        
        # 3. Find Group 4FB FASE 2 G3
        group_name = "4FB FASE 2 G3"
        print(f"Finding group: {group_name}...")
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
                print("Group found! Clicking...")
                await target_grp_el.scroll_into_view_if_needed()
                await target_grp_el.click()
                found_grp = True
                break
            await page.mouse.wheel(0, 350)
            await page.wait_for_timeout(250)
            
        if not found_grp:
            print(f"Group {group_name} not found!")
            await browser.close()
            return
            
        await page.wait_for_timeout(3000)
        
        # 4. Extract Standings (Classificació)
        print("Clicking Classificació tab...")
        await page.evaluate("""() => {
            let tabs = Array.from(document.querySelectorAll('li, button, a, label, .mbsc-segmented-item, .mbsc-scv-item, span, b, div'));
            let classTab = tabs.find(e => e.innerText && e.innerText.trim().toLowerCase().includes('classificació'));
            if (classTab) {
                classTab.click();
                return true;
            }
            return false;
        }""")
        await page.wait_for_timeout(3000)
        
        standings = []
        rows = await page.query_selector_all(".mbsc-lv-item")
        print(f"Scraping standings from {len(rows)} rows...")
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
                
                is_current = "somos" in name_cell.lower() and "4fa" in name_cell.lower()
                
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
                print("Row standings error:", e)
                
        print("\n--- STANDINGS SCRAPED ---")
        print(json.dumps(standings, indent=2, ensure_ascii=False))
        
        # 5. Extract Schedule (Partits)
        print("Clicking Partits/Jornades tab...")
        await page.evaluate("""() => {
            let tabs = Array.from(document.querySelectorAll('li, button, a, label, .mbsc-segmented-item, .mbsc-scv-item, span, b, div'));
            let partitsTab = tabs.find(e => e.innerText && (e.innerText.trim().toLowerCase().includes('partits') || e.innerText.trim().toLowerCase().includes('jornades')));
            if (partitsTab) {
                partitsTab.click();
                return true;
            }
            return false;
        }""")
        await page.wait_for_timeout(3000)
        
        schedule = []
        # Scroll to load matches
        for scroll_idx in range(6):
            await page.mouse.wheel(0, 1000)
            await page.wait_for_timeout(300)
            
        match_els = await page.query_selector_all(".mbsc-lv-item")
        print(f"Scraping schedule from {len(match_els)} rows...")
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
                
                is_team1_target = "somos" in team1.lower() and "4fa" in team1.lower()
                is_team2_target = "somos" in team2.lower() and "4fa" in team2.lower()
                
                if not is_team1_target and not is_team2_target:
                    continue
                    
                opponent = team2 if is_team1_target else team1
                isHome = is_team1_target
                score = "Pendiente"
                status = "upcoming"
                
                if is_completed:
                    score = f"{score1} - {score2}" if isHome else f"{score2} - {score1}"
                    status = "completed"
                    
                schedule.append({
                    "j": j_num,
                    "date": date,
                    "time": time_str,
                    "opponent": opponent.upper(),
                    "score": score,
                    "venue": venue,
                    "isHome": isHome,
                    "status": status
                })
                j_count += 1
            except Exception as e:
                print("Row schedule error:", e)
                
        schedule.sort(key=lambda x: x["j"])
        print("\n--- SCHEDULE SCRAPED ---")
        print(json.dumps(schedule, indent=2, ensure_ascii=False))
        
        await context.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
