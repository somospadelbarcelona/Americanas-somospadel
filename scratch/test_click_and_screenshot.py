import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(line_buffering=True)

async def main():
    print("Iniciando Playwright...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox"]
        )
        page = await browser.new_page()
        page.set_default_timeout(15000)
        
        await page.goto("https://summapadel.com/event/151", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        # Take screenshot of home page
        print("Guardando screenshot inicio...")
        await page.screenshot(path="scratch/1_inicio.png")

        # Click Masculina
        print("[1] Haciendo clic en Masculina...")
        await page.evaluate("""() => {
            let labels = Array.from(document.querySelectorAll('label, .mbsc-segmented-item, div, span'));
            let t = labels.find(e => e.innerText && (e.innerText.trim() === 'Masculina' || e.innerText.trim() === 'Masculí'));
            if (t) t.click();
        }""")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="scratch/2_masculina.png")

        # Buscando division
        div_keywords = ["M3", "Tercera"]
        print(f"Buscando division: {div_keywords}")
        
        elements = await page.query_selector_all("li, .mbsc-lv-item")
        target_element = None
        for el in elements:
            text = (await el.inner_text()).replace('\n', ' ').strip().lower()
            if all(kw.lower() in text for kw in div_keywords):
                target_element = el
                break

        if not target_element:
            print("Division no encontrada!")
            await browser.close()
            return
            
        print(f"Division encontrada. Clicando de forma nativa...")
        await target_element.scroll_into_view_if_needed()
        await target_element.click()
        
        await page.wait_for_timeout(4000)
        await page.screenshot(path="scratch/3_after_click_division.png")
        print("Guardado screenshot de division cliqueada. URL actual:", page.url)

        # List visible elements
        items = await page.query_selector_all("li, .mbsc-lv-item, div, span")
        print(f"Total elementos encontrados: {len(items)}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
