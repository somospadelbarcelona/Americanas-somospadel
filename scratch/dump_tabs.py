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

        # Clic grupo 3MB FASE 2 G3
        items = await page.query_selector_all("li, .mbsc-lv-item, .mbsc-grid-col")
        for item in items:
            text = (await item.inner_text()).replace('\n', ' ').strip().lower()
            if "3mb fase 2 g3" in text:
                await item.click()
                break
        await page.wait_for_timeout(3000)

        # Dump all elements containing "Classificació" or "Jornades"
        print("=== ELEMENTS CONTATINING CLASSIFICACIO / JORNADES ===")
        elements_to_check = await page.query_selector_all("*")
        for i, el in enumerate(elements_to_check):
            try:
                tag_name = await el.evaluate("e => e.tagName")
                class_name = await el.evaluate("e => e.className")
                text = (await el.inner_text()).strip()
                if "Classificaci" in text or "Jornade" in text:
                    # Let's filter out parents that just contain a lot of text
                    if len(text) < 100:
                        print(f"Index {i} | Tag: {tag_name} | Class: {class_name} | Text: '{text}'")
            except:
                pass

        await browser.close()

asyncio.run(main())
