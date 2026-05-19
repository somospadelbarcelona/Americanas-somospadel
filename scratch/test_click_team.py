import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(line_buffering=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
        page.on("requestfailed", lambda req: print(f"REQUEST FAILED: {req.url} - {req.failure}"))
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
            await page.wait_for_timeout(2000)
            print("Clic en Clasificacion realizado.")
        else:
            print("ERROR: No se pudo encontrar el tab de Clasificacion!")
            await browser.close()
            return

        # Print all visible element texts inside the classification table/list to identify what we can click
        list_items = await page.query_selector_all("li, .mbsc-lv-item, tr, .mbsc-grid-row")
        print(f"Encontrados {len(list_items)} items de lista en clasificacion.")
        target_team_el = None
        for item in list_items:
            try:
                if await item.is_visible():
                    text = (await item.inner_text()).strip()
                    if "Somos" in text or "BCN" in text:
                        print(f"Item de equipo encontrado: '{text.replace(chr(10), ' ')}'")
                        target_team_el = item
                        break
            except:
                pass

        if target_team_el:
            print("Clicando en el equipo...")
            await target_team_el.click()
            # Esperamos a que cargue la información (los 3 spinners de Mobiscroll suelen tardar)
            await page.wait_for_timeout(7000)
            await page.screenshot(path="scratch/team_detail_page.png")
            print("Screenshot de pagina de equipo guardado.")
            
            # Print page text to see if players/roster is listed
            body_text = await page.inner_text("body")
            print("=== BODY TEXT DE DETALLE DE EQUIPO ===")
            print(body_text[:3000])
        else:
            print("ERROR: No se encontro el item del equipo!")

        await browser.close()

asyncio.run(main())
