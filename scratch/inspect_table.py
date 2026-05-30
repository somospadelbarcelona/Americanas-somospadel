import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("Starting Playwright...", flush=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        page.set_default_timeout(60000)
        
        # Load the event page
        url = "https://summapadel.com/event/151"
        print(f"Navigating to {url}...", flush=True)
        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        
        # Go to 'Mixte'
        await page.evaluate("""() => {
            let el = Array.from(document.querySelectorAll('li, button, label, .mbsc-segmented-item, span')).find(e => e.innerText && e.innerText.trim().toLowerCase().includes('mixte'));
            if (el) el.click();
        }""")
        await page.wait_for_timeout(1500)
        
        # Go to 'Quarta'
        await page.evaluate("""() => {
            let el = Array.from(document.querySelectorAll('li, .mbsc-lv-item')).find(e => e.innerText && e.innerText.toLowerCase().includes('quarta'));
            if (el) { el.scrollIntoView(); el.click(); }
        }""")
        await page.wait_for_timeout(2000)
        
        # Click group '4XB FASE 2 G1'
        await page.evaluate("""() => {
            let el = Array.from(document.querySelectorAll('li, .mbsc-lv-item, .mbsc-grid-col')).find(e => e.innerText && e.innerText.toLowerCase().includes('4xb fase 2 g1'));
            if (el) { el.scrollIntoView(); el.click(); }
        }""")
        await page.wait_for_timeout(2500)
        
        # Go to standings tab
        await page.evaluate("""() => {
            let el = Array.from(document.querySelectorAll('li, button, label, .mbsc-segmented-item, span')).find(e => e.innerText && e.innerText.trim().toLowerCase().includes('classificació'));
            if (el) el.click();
        }""")
        await page.wait_for_timeout(2000)
        
        # Let's inspect the entire DOM of the standings tab!
        print("\n--- Inspecting tr elements ---")
        trs = await page.query_selector_all("tr")
        print(f"Found {len(trs)} 'tr' elements.")
        for idx, tr in enumerate(trs[:15]):
            text = await tr.inner_text()
            print(f"TR {idx}: {text.replace('\n', ' | ')}")
            
        print("\n--- Inspecting mbsc-grid-row elements ---")
        rows = await page.query_selector_all(".mbsc-grid-row")
        print(f"Found {len(rows)} '.mbsc-grid-row' elements.")
        for idx, row in enumerate(rows[:15]):
            text = await row.inner_text()
            print(f"ROW {idx}: {text.replace('\n', ' | ')}")
            
        print("\n--- Inspecting table cells ---")
        tds = await page.query_selector_all("td, .mbsc-grid-col")
        print(f"Found {len(tds)} cell elements.")
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
