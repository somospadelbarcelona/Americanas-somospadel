import asyncio
import sys
import re
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

        # Clic grupo 3MB FASE 2 G3
        items = await page.query_selector_all("li, .mbsc-lv-item, .mbsc-grid-col")
        for item in items:
            text = (await item.inner_text()).replace('\n', ' ').strip().lower()
            if "3mb fase 2 g3" in text:
                await item.click()
                break
        await page.wait_for_timeout(3000)

        # Clic Clasificacion nativo
        print("Intentando clic Clasificacio nativo...")
        try:
            # Buscamos por texto usando locator nativo
            loc = page.locator("li.mbsc-scv-item").filter(has_text=re.compile("classific", re.IGNORECASE))
            await loc.click()
            print("Clic nativo completado.")
        except Exception as e:
            print(f"Error clic nativo: {e}")

        await page.wait_for_timeout(3000)
        await page.screenshot(path="scratch/group_clasificacion_native.png")

        # Let's print the standings table rows if we find any
        rows = await page.query_selector_all("tr, .mbsc-grid-row")
        print(f"Filas encontradas en Clasificacion: {len(rows)}")

        await browser.close()

asyncio.run(main())
