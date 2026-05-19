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
        await page.wait_for_timeout(3000)

        # Print collapsibles structure
        print("=== COLLAPSIBLES ===")
        cols = await page.query_selector_all(".mbsc-collapsible, .mbsc-collapsible-header, [data-role='collapsible']")
        for i, col in enumerate(cols):
            text = (await col.inner_text()).replace('\n', ' ').strip()
            html = await col.evaluate("e => e.outerHTML")
            print(f"\nCollapsible {i}: {text[:100]}")
            print(f"HTML: {html[:200]}")

        await browser.close()

asyncio.run(main())
