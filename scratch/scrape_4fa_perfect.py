import asyncio
import json
import re
from playwright.async_api import async_playwright

async def main():
    print("Starting Playwright for perfect scrape of 'somos-padel-bcn-4fa'...")
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
        await page.wait_for_timeout(4000)
        
        # 1. Click Femení tab exactly as in debug_dom.py
        print("Selecting Femení tab...")
        selected = await page.evaluate("""() => {
            let els = Array.from(document.querySelectorAll('label, li, span, button, a, .mbsc-segmented-item-text'));
            let f = els.find(e => e.innerText && e.innerText.trim().toLowerCase() === 'femení');
            if (f) {
                f.click();
                return 'Clicked Femení exactly';
            }
            let f2 = els.find(e => e.innerText && e.innerText.trim().toLowerCase().includes('femen'));
            if (f2) {
                f2.click();
                return 'Clicked Femen (partial)';
            }
            return 'Not found';
        }""")
        print("Selection result:", selected)
        await page.wait_for_timeout(3000)
        
        # 2. Click F4 Femenina - Cuarta
        print("Clicking F4 Femenina - Cuarta...")
        clicked_div = await page.evaluate("""() => {
            let items = Array.from(document.querySelectorAll('li.mbsc-lv-item, .mbsc-listview-item'));
            let target = items.find(el => {
                let text = el.innerText.toLowerCase();
                return text.includes('f4') && text.includes('cuarta');
            });
            if (target) {
                target.scrollIntoView();
                target.click();
                return 'Clicked F4 division';
            }
            return 'Division not found';
        }""")
        print("Division click result:", clicked_div)
        await page.wait_for_timeout(3000)
        
        # Expand collapsibles
        await page.evaluate("""() => {
            document.querySelectorAll('.mbsc-collapsible-header').forEach(h => {
                if (h.getAttribute('aria-expanded') !== 'true') h.click();
            });
        }""")
        await page.wait_for_timeout(1500)
        
        # 3. Click Group 4FB FASE 2 G3
        group_name = "4FB FASE 2 G3"
        print(f"Clicking group: {group_name}...")
        clicked_grp = await page.evaluate(f"""(gName) => {{
            let items = Array.from(document.querySelectorAll('li.mbsc-lv-item, .mbsc-listview-item, .mbsc-grid-col'));
            let target = items.find(el => el.innerText.includes(gName));
            if (target) {{
                target.scrollIntoView();
                target.click();
                return 'Clicked group';
            }}
            return 'Group not found';
        }}""", group_name)
        print("Group click result:", clicked_grp)
        await page.wait_for_timeout(4000)
        
        # 4. Extract Standings (Classificació)
        print("Clicking Classificació tab...")
        await page.evaluate("""() => {
            let tabs = Array.from(document.querySelectorAll('li, button, a, label, .mbsc-segmented-item, .mbsc-scv-item, span, b, div, .mbsc-segmented-item-text'));
            let classTab = tabs.find(e => e.innerText && e.innerText.trim().toLowerCase().includes('classificació'));
            if (classTab) {
                classTab.click();
                return 'Clicked Classificació';
            }
            let classTab2 = tabs.find(e => e.innerText && e.innerText.trim().toLowerCase().includes('classificac'));
            if (classTab2) {
                classTab2.click();
                return 'Clicked Classificac (partial)';
            }
            return 'Classificació tab not found';
        }""")
        await page.wait_for_timeout(3000)
        
        standings = await page.evaluate("""() => {
            let rows = Array.from(document.querySelectorAll('.mbsc-lv-item, .mbsc-listview-item'));
            let data = [];
            for (let row of rows) {
                let text = row.innerText.trim();
                if (!text) continue;
                let lines = text.split('\\n').map(l => l.trim()).filter(l => l);
                if (lines.length < 3) continue;
                
                let stats = lines[0].split(/\s+/);
                let pj = 0;
                let pts = 0;
                if (stats.length >= 2) {
                    pj = parseInt(stats[0]) || 0;
                    pts = parseInt(stats[1]) || 0;
                }
                let teamName = lines[1];
                let captain = lines[2];
                
                data.push({
                    pos: data.length + 1,
                    team: teamName.toUpperCase(),
                    pj: pj,
                    pg: Math.max(0, pts - pj), // calculated
                    pp: Math.max(0, pj - Math.max(0, pts - pj)), // calculated
                    df: 0,
                    pts: pts,
                    isCurrent: teamName.toLowerCase().includes('somos') && teamName.toLowerCase().includes('4fa')
                });
            }
            return data;
        }""")
        
        print("\n=== LIVE STANDINGS SCRAPED ===")
        print(json.dumps(standings, indent=2, ensure_ascii=False))
        
        # 5. Extract Schedule (Partits)
        print("\nClicking Partits/Jornades tab...")
        await page.evaluate("""() => {
            let tabs = Array.from(document.querySelectorAll('li, button, a, label, .mbsc-segmented-item, .mbsc-scv-item, span, b, div, .mbsc-segmented-item-text'));
            let partitsTab = tabs.find(e => e.innerText && (e.innerText.trim().toLowerCase().includes('partits') || e.innerText.trim().toLowerCase().includes('jornades')));
            if (partitsTab) {
                partitsTab.click();
                return 'Clicked Partits/Jornades';
            }
            return 'Partits/Jornades tab not found';
        }""")
        await page.wait_for_timeout(3000)
        
        # Scroll to load matches
        for scroll_idx in range(5):
            await page.mouse.wheel(0, 1000)
            await page.wait_for_timeout(300)
            
        schedule = await page.evaluate("""() => {
            let items = Array.from(document.querySelectorAll('.mbsc-lv-item, .mbsc-listview-item'));
            let data = [];
            let jCount = 1;
            for (let item of items) {
                let text = item.innerText.trim();
                if (!text) continue;
                let lines = text.split('\\n').map(p => p.trim()).filter(p => p);
                if (lines.length < 7) continue;
                
                let date = lines[0];
                let round_str = lines[1];
                let time_str = lines[2];
                let venue = lines[3];
                let status_str = lines[4];
                
                let jNum = jCount;
                let jMatch = round_str.match(/\d+/);
                if (jMatch) jNum = parseInt(jMatch[0]);
                
                let score1 = "";
                let team1 = "";
                let score2 = "";
                let team2 = "";
                let isCompleted = false;
                
                if (lines.length >= 9 && !isNaN(parseInt(lines[5]))) {
                    score1 = lines[5];
                    team1 = lines[6];
                    score2 = lines[7];
                    team2 = lines[8];
                    isCompleted = true;
                } else if (lines.length >= 7) {
                    team1 = lines[5];
                    team2 = lines[6];
                    isCompleted = false;
                }
                
                let isT1 = team1.toLowerCase().includes('somos') && team1.toLowerCase().includes('4fa');
                let isT2 = team2.toLowerCase().includes('somos') && team2.toLowerCase().includes('4fa');
                
                if (!isT1 && !isT2) continue;
                
                let opponent = isT1 ? team2 : team1;
                let isHome = isT1;
                let score = "Pendiente";
                let status = "upcoming";
                
                if (isCompleted) {
                    score = isHome ? `${score1} - ${score2}` : `${score2} - ${score1}`;
                    status = "completed";
                }
                
                data.push({
                    j: jNum,
                    date: date,
                    time: time_str,
                    opponent: opponent.toUpperCase(),
                    score: score,
                    venue: venue,
                    isHome: isHome,
                    status: status
                });
                jCount++;
            }
            return data;
        }""")
        
        print("\n=== LIVE SCHEDULE SCRAPED ===")
        print(json.dumps(schedule, indent=2, ensure_ascii=False))
        
        # Save to a json file
        scraped_data = {
            "standings": standings,
            "schedule": schedule
        }
        with open("scratch/scraped_4fa.json", "w", encoding="utf-8") as f:
            json.dump(scraped_data, f, ensure_ascii=False, indent=2)
        print("\nSaved output to scratch/scraped_4fa.json")
        
        await context.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
