import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(line_buffering=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        await page.goto("https://summapadel.com/event/151", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        # Click Masculina
        await page.evaluate("""() => {
            let labels = Array.from(document.querySelectorAll('label, .mbsc-segmented-item, div, span'));
            let t = labels.find(e => e.innerText && (e.innerText.trim() === 'Masculina' || e.innerText.trim() === 'Masculí'));
            if (t) t.click();
        }""")
        await page.wait_for_timeout(2000)

        # Click Tercera
        elements = await page.query_selector_all("li, .mbsc-lv-item")
        for el in elements:
            text = (await el.inner_text()).replace('\n', ' ').strip().lower()
            if "m3" in text and "tercera" in text:
                await el.click()
                break
        await page.wait_for_timeout(2500)

        # Expand collapsibles
        try:
            collapsibles = await page.query_selector_all(".mbsc-collapsible-header")
            for col in collapsibles:
                if await col.is_visible():
                    aria_expanded = await col.get_attribute("aria-expanded")
                    if aria_expanded == "false":
                        await col.click()
                        await page.wait_for_timeout(200)
        except:
            pass
        await page.wait_for_timeout(1000)

        # Click grupo 3MB FASE 2 G3
        items = await page.query_selector_all("li, .mbsc-lv-item, .mbsc-grid-col")
        for item in items:
            text = (await item.inner_text()).replace('\n', ' ').strip().lower()
            if "3mb fase 2 g3" in text:
                await item.click()
                break
        await page.wait_for_timeout(3000)

        # We are on the Jornades (matches) page. Let's dump all card/list elements
        print("--- DUMPING POTENTIAL MATCH ELEMENTS ---")
        
        # Try finding elements by class
        selectors = [
            ".mbsc-card", 
            ".mbsc-listview-item", 
            ".mbsc-lv-item",
            "li", 
            "div.mbsc-grid-row", 
            ".mbsc-grid-row",
            "div.card",
            "div"
        ]
        
        for sel in selectors[:6]:
            els = await page.query_selector_all(sel)
            visible_count = 0
            for el in els:
                if await el.is_visible():
                    visible_count += 1
            print(f"Selector '{sel}': total={len(els)}, visible={visible_count}")
            
        # Print first 5 visible cards
        print("=== FIRST 5 VISIBLE CARDS (.mbsc-card) ===")
        cards = await page.query_selector_all(".mbsc-card")
        count = 0
        for card in cards:
            if await card.is_visible():
                text = (await card.inner_text()).strip()
                print(f"Card {count}:\n{text}\n" + "="*30)
                count += 1
                if count >= 5:
                    break
                    
        # Print first 10 visible list items (.mbsc-lv-item)
        print("=== FIRST 10 VISIBLE LIST ITEMS (.mbsc-lv-item) ===")
        items = await page.query_selector_all(".mbsc-lv-item")
        count = 0
        for item in items:
            if await item.is_visible():
                text = (await item.inner_text()).strip()
                print(f"Item {count}:\n{text}\n" + "="*30)
                count += 1
                if count >= 10:
                    break

        await browser.close()

asyncio.run(main())
