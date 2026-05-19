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

        # Click Clasificacion tab
        handle = await page.evaluate_handle("""() => {
            let elements = Array.from(document.querySelectorAll('li, button, a, label, .mbsc-segmented-item, .mbsc-scv-item, span, b'));
            let candidates = elements.filter(e => {
                let isVisible = e.offsetWidth > 0 || e.offsetHeight > 0 || e.getClientRects().length > 0;
                return isVisible && e.innerText && e.innerText.trim().toLowerCase().includes('classific');
            });
            if (candidates.length > 0) {
                candidates.sort((a, b) => a.innerText.trim().length - b.innerText.trim().length);
                return candidates[0];
            }
            return null;
        }""")
        element = handle.as_element()
        if element:
            await element.click()
            await page.wait_for_timeout(3000)
            print("Clic en Clasificacion realizado.")
            
        list_items = await page.query_selector_all("li, .mbsc-lv-item, tr, .mbsc-grid-row")
        print(f"Encontrados {len(list_items)} items de lista en clasificacion.")
        for i, item in enumerate(list_items):
            try:
                if await item.is_visible():
                    text = (await item.inner_text()).strip()
                    # Si contiene "Somos" o "Gimeno" o "Crazy" para ver ejemplos reales
                    if len(text) > 0 and len(text) < 300:
                        lines = [l.strip() for l in text.split("\n") if l.strip()]
                        print(f"Item {i} (lines={len(lines)}): {lines}")
            except:
                pass

        await browser.close()

asyncio.run(main())
