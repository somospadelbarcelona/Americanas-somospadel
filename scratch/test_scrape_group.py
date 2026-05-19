import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(line_buffering=True)

async def click_tab_robust(page, terms):
    for term in terms:
        try:
            handle = await page.evaluate_handle(f"""(term) => {{
                let elements = Array.from(document.querySelectorAll('li, button, a, label, .mbsc-segmented-item, .mbsc-scv-item, span, b'));
                let candidates = elements.filter(e => {{
                    let isVisible = e.offsetWidth > 0 || e.offsetHeight > 0 || e.getClientRects().length > 0;
                    return isVisible && e.innerText && e.innerText.trim().toLowerCase().includes(term.toLowerCase());
                }});
                if (candidates.length > 0) {{
                    candidates.sort((a, b) => a.innerText.trim().length - b.innerText.trim().length);
                    let chosen = candidates[0];
                    console.log("FOUND TAB TO CLICK:", chosen.tagName, "Class:", chosen.className, "Text:", chosen.innerText.trim());
                    return chosen;
                }}
                return null;
            }}""", term)
            
            element = handle.as_element()
            if element:
                # scroll_into_view_if_needed no debería ser necesario si ya es visible, pero por si acaso
                await element.click()
                await page.wait_for_timeout(2000)
                return True
        except Exception as e:
            print(f"Error click_tab_robust: {e}")
    return False

async def main():
    print("Iniciando Playwright...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox"]
        )
        page = await browser.new_page()
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
        page.set_default_timeout(15000)
        
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

        # Desplegar acordeones de grupos (solo si están cerrados!)
        try:
            collapsibles = await page.query_selector_all(".mbsc-collapsible-header")
            for col in collapsibles:
                try:
                    if await col.is_visible():
                        aria_expanded = await col.get_attribute("aria-expanded")
                        if aria_expanded == "false":
                            await col.click()
                            await page.wait_for_timeout(200)
                except:
                    pass
        except:
            pass
        await page.wait_for_timeout(1000)

        # Clic grupo 3MB FASE 2 G3
        items = await page.query_selector_all("li, .mbsc-lv-item, .mbsc-grid-col")
        found_group = False
        for item in items:
            text = (await item.inner_text()).replace('\n', ' ').strip().lower()
            if "3mb fase 2 g3" in text:
                print(f"Grupo encontrado para clicar: {text}")
                await item.click()
                found_group = True
                break
        if not found_group:
            print("ERROR: No se encontro el grupo '3mb fase 2 g3'!")
        await page.wait_for_timeout(3000)
        await page.screenshot(path="scratch/group_page.png")
        print("Guardado screenshot de pagina del grupo.")

        # Clic Clasificacion
        print("Intentando clic Clasificacion...")
        success_class = await click_tab_robust(page, ["classific", "clasific", "stand"])
        print(f"Clic Clasificacion: {success_class}")
        await page.screenshot(path="scratch/group_clasificacion.png")

        # Clic Partidos
        print("Intentando clic Partidos...")
        success_partidos = await click_tab_robust(page, ["partit", "partid", "match"])
        print(f"Clic Partidos: {success_partidos}")
        await page.screenshot(path="scratch/group_partidos.png")

        # Clic Jugadores
        print("Intentando clic Jugadores...")
        success_jugadores = await click_tab_robust(page, ["jugad", "player"])
        print(f"Clic Jugadores: {success_jugadores}")
        await page.screenshot(path="scratch/group_jugadores.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
