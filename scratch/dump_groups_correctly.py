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
        await page.wait_for_timeout(2000)

        # Click Masculina
        print("[1] Haciendo clic en Masculina...")
        await page.evaluate("""() => {
            let labels = Array.from(document.querySelectorAll('label, .mbsc-segmented-item, div, span'));
            let t = labels.find(e => e.innerText && (e.innerText.trim() === 'Masculina' || e.innerText.trim() === 'Masculí'));
            if (t) t.click();
        }""")
        await page.wait_for_timeout(2000)

        div_keywords = ["M3", "Tercera"]
        print(f"Buscando division: {div_keywords}")
        clicked_div = await page.evaluate("""(keywords) => {
            let els = Array.from(document.querySelectorAll('li, .mbsc-lv-item'));
            let target_el = els.find(e => {
                let text = (e.innerText || "").replace(/\\s+/g, ' ').trim().toLowerCase();
                return keywords.every(kw => text.includes(kw.toLowerCase()));
            });
            if (target_el) {
                target_el.scrollIntoView({behavior: 'smooth', block: 'center'});
                target_el.click();
                return target_el.innerText.trim();
            }
            return null;
        }""", div_keywords)

        if not clicked_div:
            print("Division no encontrada!")
            await browser.close()
            return
            
        print(f"Division clickeada: {clicked_div}")
        await page.wait_for_timeout(3000)

        # Expand all collapsibles
        try:
            collapsibles = await page.query_selector_all(".mbsc-collapsible-header, [data-role='collapsible']")
            print(f"Collapsibles encontrados: {len(collapsibles)}")
            for col in collapsibles:
                try:
                    if await col.is_visible():
                        await col.click()
                        await page.wait_for_timeout(200)
                except:
                    pass
        except Exception as e:
            print(f"Error expandiendo: {e}")
            
        await page.wait_for_timeout(1000)

        # Scroll to load all
        for _ in range(8):
            await page.mouse.wheel(0, 400)
            await page.wait_for_timeout(300)
            
        print("\n--- TODOS LOS ITEMS BAJO TERCERA M3 ---")
        items = await page.query_selector_all("li, .mbsc-lv-item, div, span")
        seen = set()
        for item in items:
            try:
                if await item.is_visible():
                    text = (await item.inner_text()).strip()
                    text_clean = " ".join(text.split())
                    if text_clean and len(text_clean) > 2 and len(text_clean) < 150:
                        if text_clean not in seen:
                            seen.add(text_clean)
                            print(f"- {text_clean}")
            except:
                pass

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
